variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "profile" {
  type    = string
  default = "demo"
}

variable "num_vpcs" {
  type    = number
  default = 1
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
}

variable "private_subnet_cidrs" {
  type    = list(string)
  default = ["10.0.4.0/24", "10.0.5.0/24", "10.0.6.0/24"]
}

variable "key_pair" {
  type    = string
  default = "ec2"
}

variable "ami_id" {
  type    = string
  default = "ami-0e4bc910af45f48fa"
}

variable "app_port" {
  type    = number
  default = 3000
}

variable "db_engine" {
  type    = string
  default = "mysql"
}

variable "db_engine_version" {
  type    = string
  default = "8.0.27"
}

variable "db_instance_class" {
  type    = string
  default = "db.t3.micro"
}

variable "db_name" {
  type    = string
  default = "csye6225"
}

variable "db_username" {
  type    = string
  default = "csye6225"
}

variable "db_password" {
  type    = string
  default = "Antpassword123!"
}

variable "db_identifier" {
  type    = string
  default = "csye6225"
}

variable "domain_name" {
  type    = string
  default = "demo.anitaawspractice.me"
}

variable "s3_policy_name" {
  type    = string
  default = "WebAppS3"
}

variable "ec2_role_name" {
  type    = string
  default = "EC2-CSYE6225"
}

