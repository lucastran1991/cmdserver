#!/bin/bash

echo "🔍 Comprehensive connectivity test for Next.js app"
echo "================================================="

# Check if app is running
echo "1️⃣ Checking if Next.js app is running..."
if pgrep -f "next start" > /dev/null; then
    echo "✅ Next.js process found"
    ps aux | grep "next start" | head -1
else
    echo "❌ Next.js process not found"
    echo "💡 Try running: npm start"
fi

echo ""

# Check port 8888
echo "2️⃣ Checking port 8888..."
port_check=$(sudo netstat -tlnp | grep :8888)
if [ -n "$port_check" ]; then
    echo "✅ Port 8888 is listening:"
    echo "$port_check"
else
    echo "❌ Port 8888 is not listening"
fi

echo ""

# Check local connectivity
echo "3️⃣ Testing local connectivity..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8888 | grep -q "200"; then
    echo "✅ localhost:8888 responds"
else
    echo "❌ localhost:8888 not responding"
fi

echo ""

# Check network interfaces
echo "4️⃣ Network interface information..."
echo "Private IP: $(hostname -I | awk '{print $1}')"
echo "Public IP: $(curl -s http://ifconfig.me)"

echo ""

# Test external connectivity
echo "5️⃣ Testing external connectivity..."
public_ip=$(curl -s http://ifconfig.me)
if [ -n "$public_ip" ]; then
    echo "Testing http://$public_ip:8888"
    response=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://$public_ip:8888)
    if [ "$response" = "200" ]; then
        echo "✅ External access works"
    else
        echo "❌ External access failed (HTTP $response)"
        echo "💡 Check AWS Security Group for port 8888"
    fi
else
    echo "❌ Could not determine public IP"
fi

echo ""

# Security group simulation
echo "6️⃣ AWS Security Group Check..."
echo "🔒 Make sure your security group has this inbound rule:"
echo "   Type: Custom TCP"
echo "   Port: 8888"
echo "   Source: 0.0.0.0/0"
echo ""

echo "7️⃣ Domain DNS Check..."
echo "🌐 Testing domain resolution for veoliaint.atomiton.com"
domain_ip=$(nslookup veoliaint.atomiton.com | grep -A1 "Name:" | tail -1 | awk '{print $2}')
if [ "$domain_ip" = "$public_ip" ]; then
    echo "✅ Domain resolves to correct IP ($domain_ip)"
else
    echo "❌ Domain resolves to: $domain_ip"
    echo "❌ Expected IP: $public_ip"
    echo "💡 Update DNS records to point to your EC2 public IP"
fi
