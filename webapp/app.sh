#!/bin/bash

# Install updates and upgrades
sudo yum update -y
sudo yum upgrade -y

# Install MySQL
echo "Installing MySQL"
sudo yum install mysql -y

# Install dependencies
echo "Installing dependencies"
sudo yum install -y gcc-c++ make
curl -sL https://rpm.nodesource.com/setup_14.x | sudo -E bash -
sudo yum install -y nodejs
echo "Node.js installed successfully"
echo "$(npm --version) is the version of npm"

# Install CloudWatch Agent
echo "Installing AWS CloudWatch Agent"
sudo yum install -y amazon-cloudwatch-agent
sudo yum install -y python-pip
sudo pip install awscli

sudo yum install unzip -y

cd ~/&& unzip webapp.zip -d ~/webapp

sudo chown -R ec2-user:ec2-user /home/ec2-user/webapp

# Install the node server
echo "Installing the node server"
cd /home/ec2-user/webapp

# install application dependencies
sudo npm install

# create logs folder in webapp and set permissions
sudo mkdir -p /home/ec2-user/webapp/logs
sudo touch /home/ec2-user/webapp/logs/csye6225.log
sudo chmod 775 /home/ec2-user/webapp/logs/csye6225.log

echo "Copy cloudwatch agent config file to /opt/awscloudwatchconfig.json"
sudo cp /home/ec2-user/webapp/awscloudwatchconfig.json /opt/awscloudwatchconfig.json

# autorun with systemd
sudo cp /tmp/nodeserver.service /etc/systemd/system/nodeserver.service
sudo systemctl enable nodeserver.service
sudo systemctl start nodeserver.service
