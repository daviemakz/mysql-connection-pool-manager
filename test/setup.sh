# Default mySQL Settings
mysqlUser='root'
mysqlPass=''

# Setup MySQL Test Database []
mysql --user="$mysqlUser" --database=mysql --execute="DROP DATABASE IF EXISTS database_test; CREATE DATABASE IF NOT EXISTS database_test;"
mysql --user="$mysqlUser" database_test < ./data/database_test.sql

# Setup MySQL Timezone
mysql --user="$mysqlUser" --database=mysql --execute="SET GLOBAL time_zone = 'Europe/London';"

# Setup MySQL Max Connections
mysql --user="$mysqlUser" --database=mysql --execute="SET GLOBAL max_connections = 5000;"
