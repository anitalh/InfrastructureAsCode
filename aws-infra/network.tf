# Retrieves a list of available AWS availability zones
data "aws_availability_zones" "available" {
  state = "available"
}

# Creates multiple VPCs and specifies CIDR block for each VPC
resource "aws_vpc" "webapp" {
  count                = var.num_vpcs
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  tags = {
    Name = "webapp-vpc${count.index + 1}"
  }
}

# Creates an internet gateway resource and associates it with each VPC 
resource "aws_internet_gateway" "webapp" {
  count  = var.num_vpcs
  vpc_id = aws_vpc.webapp[count.index].id

  tags = {
    Name = "webapp-igw${count.index + 1}"
  }
}

# Creates a route table for the public subnet and associates it with corresponding VPC 
resource "aws_route_table" "public_route_table" {
  count  = var.num_vpcs
  vpc_id = aws_vpc.webapp[count.index].id

  route {

    # Sets the destination CIDR block to 0.0.0.0/0
    cidr_block = "0.0.0.0/0"

    # Specifies the internet gateway for the route
    gateway_id = aws_internet_gateway.webapp[count.index].id
  }

  tags = {
    Name = "webapp-public-rt${count.index + 1}"
  }
}

# Creates a route table for the private subnet and associates it with corresponding VPC 
resource "aws_route_table" "private_route_table" {
  count  = var.num_vpcs
  vpc_id = aws_vpc.webapp[count.index].id

  tags = {
    Name = "webapp-private-rt${count.index + 1}"
  }
}

# create multiple public subnets, Assigns the CIDR block and maps it to vpc, availability zones
resource "aws_subnet" "public_subnet" {
  count = length(var.public_subnet_cidrs) * var.num_vpcs

  vpc_id                  = aws_vpc.webapp[floor(count.index / length(var.public_subnet_cidrs))].id
  cidr_block              = var.public_subnet_cidrs[count.index % length(var.public_subnet_cidrs)]
  availability_zone       = element(data.aws_availability_zones.available.names, count.index)
  map_public_ip_on_launch = true
  tags = {
    Name = "webapp-public-${count.index + 1}"
  }
}

# create multiple private subnets, Assigns the CIDR block and maps it to vpc, availability zones
resource "aws_subnet" "private_subnet" {
  count = length(var.private_subnet_cidrs) * var.num_vpcs

  vpc_id            = aws_vpc.webapp[floor(count.index / length(var.private_subnet_cidrs))].id
  cidr_block        = var.private_subnet_cidrs[count.index % length(var.private_subnet_cidrs)]
  availability_zone = element(data.aws_availability_zones.available.names, count.index)
  tags = {
    Name = "webapp-private-${count.index + 1}"
  }
}

# associate public subnets with route tables.
resource "aws_route_table_association" "public_subnet" {
  count = length(var.public_subnet_cidrs) * var.num_vpcs

  subnet_id      = aws_subnet.public_subnet[count.index].id
  route_table_id = aws_route_table.public_route_table[floor(count.index / length(var.public_subnet_cidrs))].id
}

# associate private subnets with route tables.
resource "aws_route_table_association" "private_subnet" {
  count = length(var.private_subnet_cidrs) * var.num_vpcs

  subnet_id      = aws_subnet.private_subnet[count.index].id
  route_table_id = aws_route_table.private_route_table[floor(count.index / length(var.private_subnet_cidrs))].id
}

# Create the App Security Group
resource "aws_security_group" "app_security_group" {
  count       = var.num_vpcs
  name_prefix = "app_security_group_${count.index}"
  description = "Security group for hosting web applications"

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.webapp_lb_sg[count.index].id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  vpc_id = aws_vpc.webapp[count.index].id
}

# Define the DB subnet group for the RDS instance
resource "aws_db_subnet_group" "rds_subnet_group" {
  name       = "rds-subnet-group"
  subnet_ids = aws_subnet.private_subnet[*].id
}

# database security group
resource "aws_security_group" "db_security_group" {
  count       = var.num_vpcs
  name_prefix = "db_security_group_${count.index}"
  description = "Security group for hosting db"

  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.app_security_group[count.index].id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  vpc_id = aws_vpc.webapp[count.index].id
}

# Create the RDS instance
resource "aws_db_instance" "csye6225" {
  count                = var.num_vpcs
  allocated_storage    = 20
  engine               = var.db_engine
  engine_version       = var.db_engine_version
  instance_class       = var.db_instance_class
  identifier           = var.db_identifier
  db_name              = var.db_name
  username             = var.db_username
  password             = var.db_password
  db_subnet_group_name = aws_db_subnet_group.rds_subnet_group.name
  multi_az             = false
  publicly_accessible  = false
  skip_final_snapshot  = true

  # Attach the database security group to the RDS instance
  vpc_security_group_ids = [aws_security_group.db_security_group[count.index].id]
}

# random name
resource "random_pet" "bucket_name" {
  length = 4
}

# kms key
resource "aws_kms_key" "mykey" {
  description             = "This key is used to encrypt bucket objects"
  deletion_window_in_days = 10
}

# Create s3 bucket
resource "aws_s3_bucket" "private_bucket" {
  bucket = "my-bucket-${random_pet.bucket_name.id}-${terraform.workspace}"

  # Set force_destroy to true to enable deletion of non-empty S3 buckets
  force_destroy = true
}

# enable ACL to be set to "private"
resource "aws_s3_bucket_acl" "private_bucket_acl" {
  bucket = aws_s3_bucket.private_bucket.id
  acl    = "private"
}

# life cycle configuration for s3 bucket
resource "aws_s3_bucket_lifecycle_configuration" "bucket-config" {
  bucket = aws_s3_bucket.private_bucket.id

  # Define the first rule for the lifecycle configuration
  rule {
    id = "log"

    # Define how long objects with this prefix should be kept before expiring
    expiration {
      days = 90
    }

    # Filter objects to which this rule should apply based on their prefix and tags
    filter {
      and {
        prefix = "log/"

        tags = {
          rule      = "log"
          autoclean = "true"
        }
      }
    }

    # Enable this rule
    status = "Enabled"

    # Define a transition for objects with this prefix
    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }
  }

  # Define the second rule for the lifecycle configuration
  rule {
    id = "tmp"

    filter {
      prefix = "tmp/"
    }

    # Define how long objects with this prefix should be kept before expiring
    expiration {
      days = 90
    }

    status = "Enabled"
  }
}

# Enable server-side encryption for S3 buckets
resource "aws_s3_bucket_server_side_encryption_configuration" "private_bucket" {
  bucket = aws_s3_bucket.private_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.mykey.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Enable versioning configuration for s3 bucket
resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.private_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Block public access to the S3 bucket
resource "aws_s3_bucket_public_access_block" "private_bucket" {
  bucket = aws_s3_bucket.private_bucket.bucket

  # Block all public ACLs
  block_public_acls = true

  # Block all public policies
  block_public_policy = true

  # Ignore public ACLs
  ignore_public_acls = true

  # Restrict public bucket policies
  restrict_public_buckets = true
}

# Create an IAM policy that allows EC2 instances to access the S3 bucket
resource "aws_iam_policy" "webapp_s3_policy" {
  name        = var.s3_policy_name
  path        = "/"
  description = "Allows EC2 instances to perform S3 buckets"

  policy = jsonencode({
    Version = "2012-10-17"
    # grant access to get put and delete objects in s3 bucket
    Statement = [
      {
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Effect = "Allow"
        # Allow access to the S3 bucket and its contents
        Resource = [
          "${aws_s3_bucket.private_bucket.arn}",
          "${aws_s3_bucket.private_bucket.arn}/*",
        ]
      },
      {
        Action = [
          "kms:GenerateDataKey"
        ]
        Effect = "Allow"
        # Allow access to the KMS key for data key generation
        Resource = [
          aws_kms_key.mykey.arn,
        ]
      }
    ]
  })
}

# Create an IAM role for EC2 instances
resource "aws_iam_role" "ec2_role" {
  name = var.ec2_role_name
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        # Allow EC2 instances to assume this role
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  # Attach the CloudWatchAgentServerPolicy to the role
  managed_policy_arns = [
    "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
  ]
}

# Attach the S3 policy to the EC2 role
resource "aws_iam_role_policy_attachment" "webapp_s3_attachment" {
  policy_arn = aws_iam_policy.webapp_s3_policy.arn
  role       = aws_iam_role.ec2_role.name
}

# Create an instance profile for the IAM role
resource "aws_iam_instance_profile" "ec2_instance_profile" {
  name = var.ec2_role_name
  role = aws_iam_role.ec2_role.name
}

# Get the hosted zone ID for the domain name
data "aws_route53_zone" "hosted_zone" {
  name = var.domain_name
}

# Create a Route 53 record for the web application
resource "aws_route53_record" "webapp" {
  name    = var.domain_name
  type    = "A"
  zone_id = data.aws_route53_zone.hosted_zone.zone_id
  alias {
    name                   = aws_lb.webapp.dns_name
    zone_id                = aws_lb.webapp.zone_id
    evaluate_target_health = true
  }
}

# Create a target group for the EC2 instances
resource "aws_lb_target_group" "web_target_group" {
  count           = var.num_vpcs
  name            = "web-target-group-${count.index + 1}"
  port            = 3000
  protocol        = "HTTP"
  target_type     = "instance"
  ip_address_type = "ipv4"
  vpc_id          = aws_vpc.webapp[count.index].id

  health_check {
    path                = "/healthz"
    protocol            = "HTTP"
    port                = "3000"
    healthy_threshold   = 2
    unhealthy_threshold = 2
    timeout             = 3
    interval            = 30
  }

  tags = {
    Name = "web-target-group-${count.index + 1}"
  }
}

# Create an application load balancer
resource "aws_lb" "webapp" {
  name               = "webapp"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.webapp_lb_sg[0].id]
  subnets            = aws_subnet.public_subnet.*.id
  ip_address_type    = "ipv4"
  tags = {
    Application = "webapp"
  }
}

# Create a listener for the load balancer
resource "aws_lb_listener" "web_listener" {
  load_balancer_arn = aws_lb.webapp.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web_target_group[0].arn
  }
}

# Load balancer security group
resource "aws_security_group" "webapp_lb_sg" {
  name_prefix = "webapp-lb-sg"
  description = "Security group for the webapp load balancer"
  count       = var.num_vpcs
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  vpc_id = aws_vpc.webapp[count.index].id
}

# Create an AWS Launch Template resource named "lt_asg_launch_config"
resource "aws_launch_template" "lt_asg_launch_config" {
  name_prefix   = "lt-asg-launch-config"
  image_id      = var.ami_id
  instance_type = "t2.micro"
  key_name      = var.key_pair

  iam_instance_profile {
    name = aws_iam_instance_profile.ec2_instance_profile.name
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.app_security_group[0].id]
  }

  # Configure the EBS volume to be attached to the instance
  block_device_mappings {
    device_name = "/dev/xvda"
    ebs {
      volume_size           = 20
      volume_type           = "gp2"
      delete_on_termination = true
    }
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Application = "webapp"
    }
  }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    # Write environment variables to file
    cat <<-EOT > /home/ec2-user/.env
    PORT=${var.app_port}
    DB_NAME=${var.db_name}
    DB_HOST="${split(":", aws_db_instance.csye6225[0].endpoint)[0]}"
    DB_USERNAME=${var.db_username}
    DB_PASSWORD=${var.db_password}
    AWS_BUCKET_NAME=${aws_s3_bucket.private_bucket.bucket}
    AWS_REGION=${var.aws_region}

    EOT
    # Configure CloudWatch Agent
    sudo /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/awscloudwatchconfig.json -s

    # Copy .env file to webapp folder
    cp /home/ec2-user/.env /home/ec2-user/webapp/

    EOF
  )
}

# Create an AWS Auto Scaling Group resource named EC2AutoScalingGroup
resource "aws_autoscaling_group" "EC2AutoScalingGroup" {
  name             = "csye6225-asg-spring2023"
  desired_capacity = 1
  max_size         = 3
  min_size         = 1
  default_cooldown = 60

  tag {
    key                 = "Application"
    value               = "webapp"
    propagate_at_launch = true
  }

  launch_template {
    id      = aws_launch_template.lt_asg_launch_config.id
    version = "$Latest"
  }

  vpc_zone_identifier = [
    aws_subnet.public_subnet[0].id,
    aws_subnet.public_subnet[1].id,
    aws_subnet.public_subnet[2].id,
  ]

  target_group_arns = [
    aws_lb_target_group.web_target_group[0].arn
  ]
}

# Create Auto Scaling Policy for Scaling Out
resource "aws_autoscaling_policy" "EC2AutoScalingPolicyForScalingOut" {
  name                   = "EC2AutoScalingPolicyForScalingOut"
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = 1
  autoscaling_group_name = aws_autoscaling_group.EC2AutoScalingGroup.name
}

# create metric alarm for scale out
resource "aws_cloudwatch_metric_alarm" "AvgCPUUp" {
  alarm_name          = "AVGCPUUP"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 5.0

  alarm_description = "AVGCPUUP"

  alarm_actions = [
    aws_autoscaling_policy.EC2AutoScalingPolicyForScalingOut.arn
  ]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.EC2AutoScalingGroup.name
  }
}

resource "aws_autoscaling_policy" "EC2AutoScalingPolicyForScalingIn" {
  name                   = "EC2AutoScalingPolicyForScalingIn"
  adjustment_type        = "ChangeInCapacity"
  scaling_adjustment     = -1
  autoscaling_group_name = aws_autoscaling_group.EC2AutoScalingGroup.name
}

# create metric alarm for scale In
resource "aws_cloudwatch_metric_alarm" "AvgCPUDown" {
  alarm_name          = "AVGCPUDOWN"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 60
  statistic           = "Average"
  threshold           = 3.0

  alarm_description = "AVGCPUDOWN"

  alarm_actions = [
    aws_autoscaling_policy.EC2AutoScalingPolicyForScalingIn.arn
  ]

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.EC2AutoScalingGroup.name
  }
}

