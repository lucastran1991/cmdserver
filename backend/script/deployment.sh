#!/bin/bash

# Get The Current ENV
currentENV=$(sed -n '2p' "atomiton.env")
currentPort=$(sed -n '4p' "atomiton.env")
currentSource=$(sed -n '12p' "atomiton.env")
currentDataBase=$(sed -n '6p' "atomiton.env")
currentUIconfig1=$(sed -n '8p' "atomiton.env")
currentUIconfig2=$(sed -n '10p' "atomiton.env")
currentUISSO1=$(sed -n '16p' "atomiton.env")
currentUISSO2=$(sed -n '18p' "atomiton.env")
currentCTX1=$(sed -n '20p' "atomiton.env")
currentCTX2=$(sed -n '22p' "atomiton.env")
currentCTX3=$(sed -n '24p' "atomiton.env")
multitenancy=$(sed -n '26p' "atomiton.env")

#Check The Current Commit
cd $currentSource/source_code/atprofveoliaui/
currentUI=$(git rev-parse --short HEAD)

cd $currentSource/source_code/atprofveolia/
currentBE=$(git rev-parse --short HEAD)

# Check the server current mode: Production/Development
currentServerENV=$(sed -n '5s/.*:[[:space:]]*//p' "$currentSource/server/sff.auto.config.cdm" | sed 's/ *#.*//')

# Check the server Status & Pid of Java
pid=$(pidof java | xargs pwdx | grep "$currentSource/server" | awk -F ':' '{print $1}')
  if [ -n "$pid" ]; then
    serverstatus="Server is still running. And this Java Pid of the server is: $pid"
  else
    serverstatus="Server is down."
  fi

update_BE_config_file(){
# Main script to update the config file
  sed -i "4s/.*/$currentDataBase/" $currentSource/server/sff.auto.config.cdm
  sed -i "3s/.*/$multitenancy/" $currentSource/server/sff.auto.config.cdm
  sed -i "8s/sff.server.port: .*/sff.server.port: '$currentPort'/" $currentSource/server/sff.auto.config.cdm
  sed -i "75s/LOCAL/REMOTE/" $currentSource/server/sff.auto.config.cdm
  sed -i "76s/LOCAL/REMOTE/" $currentSource/server/sff.auto.config.cdm
  sed -i "77s/LOCAL/REMOTE/" $currentSource/server/sff.auto.config.cdm
  sed -i "3s/.*/$currentCTX1/" $currentSource/server/config/ctx.config.cdm
  sed -i "4s/.*/$currentCTX2/" $currentSource/server/config/ctx.config.cdm
  sed -i "5s/.*/$currentCTX3/" $currentSource/server/config/ctx.config.cdm
}

update_UI_config_file(){
# Main script to update the config file
  sed -i '3s/.*/        "host": "'"$currentUIconfig1"'",/' $currentSource/server/ui/config/veolia.config.json
  sed -i '6s/.*/        "isSSL": '$currentUIconfig2',/' $currentSource/server/ui/config/veolia.config.json
  sed -i '20s/.*/        "enableLoginSSO": '$currentUISSO1',/' $currentSource/server/ui/config/veolia.config.json
  sed -i '21s~.*~        "signOutSSOUrl": '"$currentUISSO2"'~' "$currentSource/server/ui/config/veolia.config.json"
}

restart_server(){
  pid1=$(pidof java | xargs pwdx | grep "$currentSource/server" | awk -F ':' '{print $1}')
  if [ -n "$pid1" ]; then
    echo "Killing PID: $pid"
    kill -9 $pid1
  else
    echo "No matching PID found."
  fi
  echo "Starting the Backend server..."
  update_BE_config_file
  update_UI_config_file
  cd $currentSource/server/
  nohup java @java-options.txt -ea -jar tql.engine2.4.jar &> nohup.out &
  sleep 10
  echo "Backend server started successfully"
  sleep 15  
  nohup python /data2/Atomiton/WaterTRN/DEV/pyastackcore/pyastackcore/co_engine.py > output.log &
}

restart_server_pullBe(){
  pid2=$(pidof java | xargs pwdx | grep "$currentSource/server" | awk -F ':' '{print $1}')
  if [ -n "$pid2" ]; then
    echo "Killing PID: $pid2"
    kill -9 "$pid2"
    rm -rf $currentSource/source_code/backup/sff.sqldb.data*
    rm -rf $currentSource/source_code/backup/sff.auto.launch/*
    rm -rf $currentSource/source_code/backup/spaces/reports/*
    rm -rf $currentSource/source_code/backup/ui/*
    rm -rf $currentSource/source_code/backup/serverspace/*
    rm $currentSource/source_code/backup/job.config.cdm
    cp $currentSource/server/config/job.config.cdm $currentSource/source_code/backup/
    rsync -av $currentSource/server/sff.auto.launch/ $currentSource/source_code/backup/sff.auto.launch/
    rsync -av $currentSource/server/sff.sqldb.data/ $currentSource/source_code/backup/sff.sqldb.data/
    rsync -av $currentSource/server/application/spaces/reports/ $currentSource/source_code/backup/spaces/reports/
    rsync -av $currentSource/server/ui/ $currentSource/source_code/backup/ui/
    rsync -av $currentSource/server/spaces/ $currentSource/source_code/backup/serverspace/
    rm -rf $currentSource/server/*
    rsync -av $currentSource/source_code/atprofveolia/server/ $currentSource/server/
    rm -rf $currentSource/server/sff.auto.launch/*
    rsync -av $currentSource/source_code/backup/sff.auto.launch/ $currentSource/server/sff.auto.launch/
    rm -rf $currentSource/server/sff.sqldb.data/*
    rsync -av $currentSource/source_code/backup/sff.sqldb.data/ $currentSource/server/sff.sqldb.data/
    rm -rf $currentSource/server/spaces/*
    rsync -av $currentSource/source_code/backup/serverspace/ $currentSource/server/spaces/
    rm -rf $currentSource/server/application/spaces/reports/*
    rsync -av $currentSource/source_code/backup/spaces/reports/ $currentSource/server/application/spaces/reports/
    rm -rf $currentSource/server/ui/*
    rsync -av $currentSource/source_code/backup/ui/ $currentSource/server/ui/
    rm $currentSource/server/config/job.config.cdm
    cp $currentSource/source_code/backup/job.config.cdm $currentSource/server/config/
  else
    echo "No matching PID found."
    rm -rf $currentSource/source_code/backup/sff.sqldb.data*
    rm -rf $currentSource/source_code/backup/sff.auto.launch/*
    rm -rf $currentSource/source_code/backup/spaces/reports/*
    rm -rf $currentSource/source_code/backup/ui/*
    rm -rf $currentSource/source_code/backup/serverspace/*
    rm $currentSource/source_code/backup/job.config.cdm
    cp $currentSource/server/config/job.config.cdm $currentSource/source_code/backup/
    rsync -av $currentSource/server/sff.auto.launch/ $currentSource/source_code/backup/sff.auto.launch/
    rsync -av $currentSource/server/sff.sqldb.data/ $currentSource/source_code/backup/sff.sqldb.data/
    rsync -av $currentSource/server/application/spaces/reports/ $currentSource/source_code/backup/spaces/reports/
    rsync -av $currentSource/server/ui/ $currentSource/source_code/backup/ui/
    rsync -av $currentSource/server/spaces/ $currentSource/source_code/backup/serverspace/
    rm -rf $currentSource/server/*
    rsync -av $currentSource/source_code/atprofveolia/server/ $currentSource/server/
    rm -rf $currentSource/server/sff.auto.launch/*
    rsync -av $currentSource/source_code/backup/sff.auto.launch/ $currentSource/server/sff.auto.launch/
    rm -rf $currentSource/server/sff.sqldb.data/*
    rsync -av $currentSource/source_code/backup/sff.sqldb.data/ $currentSource/server/sff.sqldb.data/
    rm -rf $currentSource/server/spaces/*
    rsync -av $currentSource/source_code/backup/serverspace/ $currentSource/server/spaces/
    rm -rf $currentSource/server/application/spaces/reports/*
    rsync -av $currentSource/source_code/backup/spaces/reports/ $currentSource/server/application/spaces/reports/
    rm -rf $currentSource/server/ui/*
    rsync -av $currentSource/source_code/backup/ui/ $currentSource/server/ui/
    rm $currentSource/server/config/job.config.cdm
    cp $currentSource/source_code/backup/job.config.cdm $currentSource/server/config/
  fi
  echo "Starting the Backend server..."
  update_BE_config_file
  update_UI_config_file
  cd $currentSource/server/
  nohup java @java-options.txt -ea -jar tql.engine2.4.jar &> nohup.out &
  sleep 10
  rm -rf $currentSource/server/application/spaces/caches/*
  nohup python /data2/Atomiton/WaterTRN/DEV/pyastackcore/pyastackcore/co_engine.py > output.log &
  echo "Updating UI source..."
  cd $currentSource/source_code/veoliaplugin/
  git checkout build
  sleep 2
  git pull
  echo "UI veolia plugin source updated successfully."
  # Ensure the directory exists
  if [ ! -d "$currentSource/server/extensions" ]; then
      echo "Directory $currentSource/server/extensions does not exist. Creating it..."
      mkdir -p "$currentSource/server/extensions"
  fi
  rm -rf $currentSource/server/extensions/*
  rsync -av $currentSource/source_code/veoliaplugin/widget/ $currentSource/server/extensions/
    echo "Backend server started successfully"
}

pull_be_source() {
  echo "Updating Backend source..."
  cd $currentSource/source_code/atprofveolia/ 
  git checkout dev
  sleep 2
  git pull
  echo "Backend source updated successfully."
  restart_server_pullBe
}

## Pull a specific commit ID of the Backend source
pull_specific_be_source() {
  read -p "Enter the commit ID: " commit_id
  echo "Updating Backend source to commit ID: $commit_id ..."
  cd $currentSource/source_code/atprofveolia/ && git fetch && git checkout $commit_id
  echo "Backend source updated successfully to commit ID: $commit_id."
  restart_server_pullBe
}

## Backup Stress map json folder
backup_stress_map() {
  echo "Backup stress-map folder"
  backup_folder="$currentSource/source_code/backup/stress-map/"
  ui_stress_map_folder="$currentSource/server/ui/assets/stress-map/"
  if [ ! -d "$backup_folder" ];
  then
    mkdir -p $backup_folder
    if [ ! -d "$ui_stress_map_folder" ];
    then
      echo "Error: stress-map folder not found at $ui_stress_map_folder"
      return 1
    else
      rsync -a --delete-before $ui_stress_map_folder/ $backup_folder/
    fi
  fi
  echo "Completed to backup stress-map folder"
}

restore_stress_map() {
  echo "Restore stress-map folder"
  backup_folder="$currentSource/source_code/backup/stress-map/"
  ui_stress_map_folder="$currentSource/server/ui/assets/stress-map/"
  rsync -a --delete-before $backup_folder/ $ui_stress_map_folder/
  echo "Completed to restore stress-map folder"
}

pull_ui_source() {
  echo "Updating UI source..."
  cd $currentSource/source_code/atprofveoliaui/
  git checkout build
  sleep 2
  git pull
  echo "UI source updated successfully."
  backup_stress_map
  rm -rf $currentSource/server/ui/*
  rsync -av $currentSource/source_code/atprofveoliaui/api-1.0/ $currentSource/server/ui/
  update_UI_config_file
  restore_stress_map
}

pull_veolia_plugin() {
  echo "Updating UI source..."
  cd $currentSource/source_code/veoliaplugin/
  git checkout build
  sleep 2
  git pull
  echo "UI veolia plugin source updated successfully."
  backup_stress_map
  # Ensure the directory exists
  if [ ! -d "$currentSource/server/extensions" ]; then
      echo "Directory $currentSource/server/application/resources does not exist. Creating it..."
      mkdir -p "$currentSource/server/extensions"
  fi
  rm -rf $currentSource/server/application/resources/*
  rsync -av $currentSource/source_code/veoliaplugin/widget/ $currentSource/server/extensions/
  restore_stress_map
}

## Pull a specific commit ID of the UI source
pull_specific_ui_source() {
  read -p "Enter the commit ID: " commit_id
  echo "Updating UI source to commit ID: $commit_id ..."
  cd $currentSource/source_code/atprofveoliaui/ && git fetch && git checkout $commit_id
  echo "UI source updated successfully to commit ID: $commit_id."
  backup_stress_map
  rm -rf $currentSource/server/ui/*
  rsync -av $currentSource/source_code/atprofveoliaui/api-1.0/ $currentSource/server/ui/
  update_UI_config_file
  restore_stress_map
}

change_environment_and_restart() {
  if [ "$currentServerENV" == "development" ]; then
    echo "Current environment: development"
    read -p "Do you want to change to production (yes/no)? " choice
    if [ "$choice" == "yes" ]; then
      sed -i '5s/development/production/' "$currentSource/server/sff.auto.config.cdm"
      restart_server
    fi
  elif [ "$currentServerENV" == "production" ]; then
    echo "Current environment: production"
    read -p "Do you want to change to development (yes/no)? " choice
    if [ "$choice" == "yes" ]; then
      sed -i '5s/production/development/' "$currentSource/server/sff.auto.config.cdm"
      restart_server
    fi
  else
    echo "Unknown environment: $currentServerENV"
  fi
}

view_error_logs() {
  cd $currentSource/server/logs/
  tail -f "$currentSource/server/logs/engine.log"
}

clear_cached() {
  rm -rf $currentSource/server/application/spaces/caches/*
}

debug_mode() {
  cd $currentSource/server/
  tail -f "$currentSource/server/nohup.out"
}

co_engine_logs() {
  cd $currentSource/server/
  tail -f "$currentSource/server/output.log"
}

re_schema() {
  sed -i '5s/production/development/' "$currentSource/server/sff.auto.config.cdm"
  echo "Update to the development mode and Reschema"
  restart_server
  sleep 15
  cd $currentSource
  python3 $currentSource/scripts/Reschema.py
  echo "Update to the Production mode and restart"
  sed -i '5s/development/production/' "$currentSource/server/sff.auto.config.cdm"
  restart_server
  sleep 15
  echo "Done Reschema Process"
}

pull_veolia_plugin() {
  echo "Updating UI source..."
  cd $currentSource/source_code/veoliaplugin/
  git checkout build
  sleep 2
  git pull
  echo "UI veolia plugin source updated successfully."
  backup_stress_map
  # Ensure the directory exists
  if [ ! -d "$currentSource/server/extensions" ]; then
      echo "Directory $currentSource/server/extensions does not exist. Creating it..."
      mkdir -p "$currentSource/server/extensions"
  fi
  rm -rf $currentSource/server/extensions/*
  rsync -av $currentSource/source_code/veoliaplugin/widget/ $currentSource/server/extensions/
  restore_stress_map
}

kill_all_engine() {
  pid1=$(pidof java | xargs pwdx | grep "$currentSource/server" | awk -F ':' '{print $1}')
  if [ -n "$pid1" ]; then
    echo "Killing PID: $pid"
    kill -9 $pid1
  else
    echo "No matching PID found."
  fi
}

# Print the Current Server Status
echo ""
echo "======================== Server's Status ========================"
echo "Current Environment: $currentENV, Port: $currentPort"
echo "Current BE CommitId: $currentBE, Current UI CommitId: $currentUI"
echo "Server is running with the mode: $currentServerENV"
echo "$serverstatus"
echo "================================================================="
echo ""
echo "Please select any options that you want to affect the current server:"
echo "1. Deploy The Latest BE Commit."
echo "2. Deploy Specific BE Commit."
echo "3. Deploy The Latest UI Commit."
echo "4. Deploy Specific UI Commit."
echo "5. Re-Schema."
echo "6. Change BE Environment and Restart."
echo "7. Restart Server."
echo "8. View ERROR Logs only."
echo "9. Clear The Cached."
echo "10. View Nohup.out Logs"
echo "11. View Co_Engine Logs"
echo "12. Deploy the latest UI Veolia Plugin Commit."
echo "13. Kill All Engine."

read -p "Enter your choice [1, 2, 3, ... , or 12]: " choice
case $choice in
  1) pull_be_source;;
  2) pull_specific_be_source;;
  3) pull_ui_source;;
  4) pull_specific_ui_source;;
  5) re_schema;;
  6) change_environment_and_restart;;
  7) restart_server;;
  8) view_error_logs;;
  9) clear_cached;;
  10) debug_mode;;
  11) co_engine_logs;;
  12) pull_veolia_plugin;;
  13) kill_all_engine;;
  *) echo "Invalid choice";;
esac
