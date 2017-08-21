# Ensure latest packages
#sudo apt-get -y update; sudo apt-get -y upgrade; sudo apt-get -y dist-upgrade; sudo apt-get -y autoremove; sudo apt-get -y autoclean;

# Pre setup variables
#sudo echo "debconf debconf/frontend select Noninteractive" | debconf-set-selections

# Default mySQL Settings
mysqlUser='root'
mysqlPass=''

# Setup MySQL Configuration
# sudo echo "mysql-server mysql-server/root_password password $mysqlPass" | debconf-set-selections
# sudo echo "mysql-server mysql-server/root_password_again password $mysqlPass" | debconf-set-selections

# Pre installation packages
#sudo apt-get update
#sudo apt-get install --no-install-recommends -y tzdata
#sudo apt-get install -y mysql-server-5.5 apt-utils git

# Start mySQL Server
#sudo service mysql start

# Setup MySQL Test Database []
mysql --user="$mysqlUser" --database=mysql --execute="DROP DATABASE IF EXISTS database_test; CREATE DATABASE IF NOT EXISTS database_test;"
mysql --user="$mysqlUser" database_test < ./data/database_test.sql

# Setup MySQL Timezone
mysql --user="$mysqlUser" --database=mysql --execute="SET GLOBAL time_zone = 'Europe/London';"

# Setup MySQL Max Connections
mysql --user="$mysqlUser" --database=mysql --execute="SET GLOBAL max_connections = 5000;"
