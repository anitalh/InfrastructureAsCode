variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "source_ami" {
  type    = string
  default = "ami-0dfcb1ef8550277af"
}

variable "ssh_username" {
  type    = string
  default = "ec2-user"
}


variable "subnet_id" {
  type    = string
  default = "subnet-0f0a0e6ee22a7fd68"
}

variable "vpc_id" {
  type    = string
  default = "vpc-0b88deeaf54088165"
}

source "amazon-ebs" "my-ami" {
  region          = var.aws_region
  ami_name        = "csye6225_${formatdate("YYYY_MM_DD_hh_mm_ss", timestamp())}"
  ami_description = "AMI for csye 6225"

  ami_users = ["768090883219"]

  ami_regions = [
    var.aws_region
  ]

  aws_polling {
    delay_seconds = 120
    max_attempts  = 50
  }

  instance_type = "t2.micro"
  source_ami    = var.source_ami
  ssh_username  = var.ssh_username
  subnet_id     = var.subnet_id
  vpc_id        = var.vpc_id

  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/xvda"
    volume_size           = 8
    volume_type           = "gp2"
  }
}

build {
  sources = ["source.amazon-ebs.my-ami"]

  provisioner "file" {
    source      = "webapp.zip"
    destination = "~/webapp.zip"
    direction   = "upload"
  }

  provisioner "file" {
    source      = "./nodeserver.service"
    destination = "/tmp/nodeserver.service"
  }

  provisioner "shell" {
    scripts = [
      "app.sh"
    ]
  }
}