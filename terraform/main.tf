provider "aws" {
  region = "us-east-1"
}

terraform {
  backend "s3" {
    bucket         = "jenkins-task-terraform-state"
    key            = "terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "jenkins-task-terraform-lock"
    encrypt        = true
  }
}

data "aws_vpc" "default" {
  default = true
}

data "aws_subnets" "default" {
  filter {
    name   = "vpc-id"
    values = [data.aws_vpc.default.id]
  }
}

data "aws_security_group" "default" {
  filter {
    name   = "group-name"
    values = ["default"]
  }

  vpc_id = data.aws_vpc.default.id
}

resource "aws_instance" "app" {
  ami                    = var.ami
  instance_type          = var.instance_type
  subnet_id              = data.aws_subnets.default.ids[0]
  vpc_security_group_ids = [data.aws_security_group.default.id]
  key_name               = var.key_name
  user_data              = file("user_data.sh")

  tags = {
    Name = "jenkins-task-terraform-instance"
  }
}
