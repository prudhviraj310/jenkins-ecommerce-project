provider "aws" {
  region = var.aws_region
}

# --- 1. NETWORKING LAYER ---
resource "aws_vpc" "devops_vpc_v3" {
  cidr_block = "10.3.0.0/16"
  tags       = { Name = "DevOps-VPC-Stack3" }
}

resource "aws_internet_gateway" "igw_v3" {
  vpc_id = aws_vpc.devops_vpc_v3.id
  tags   = { Name = "DevOps-IGW-Stack3" }
}

resource "aws_subnet" "subnet_v3" {
  vpc_id                  = aws_vpc.devops_vpc_v3.id
  cidr_block              = "10.3.1.0/24"
  map_public_ip_on_launch = true
  availability_zone       = "ap-south-1a"
  tags   = { Name = "DevOps-Subnet-Stack3" }
}

resource "aws_route_table" "rt_v3" {
  vpc_id = aws_vpc.devops_vpc_v3.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw_v3.id
  }
  tags   = { Name = "DevOps-RT-Stack3" }
}

resource "aws_route_table_association" "rta_v3" {
  subnet_id      = aws_subnet.subnet_v3.id
  route_table_id = aws_route_table.rt_v3.id
}

# --- 2. SECURITY GROUP (Fixed Naming & Lifecycle) ---
resource "aws_security_group" "devops_sg_v3" {
  name        = "DevOps-Tools-SG-V3-Final" # New Name to break the lock
  vpc_id      = aws_vpc.devops_vpc_v3.id

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 9000
    to_port     = 9000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  lifecycle {
    create_before_destroy = true
  }
}

# --- 3. JENKINS SERVER ---
resource "aws_instance" "jenkins_v3" {
  ami                    = "ami-0dee22c13ea7a9a67"
  instance_type          = "m7i-flex.large"
  key_name               = var.v3_key_name
  subnet_id              = aws_subnet.subnet_v3.id
  vpc_security_group_ids = [aws_security_group.devops_sg_v3.id]

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io
              systemctl start docker
              systemctl enable docker
              usermod -aG docker ubuntu
              docker run -d --name jenkins --restart always -p 8080:8080 -p 50000:50000 jenkins/jenkins:lts
              EOF

  tags = { Name = "JenkinsServer-Stack3" }
}

# --- 4. SONARQUBE SERVER ---
resource "aws_instance" "sonarqube_v3" {
  ami                    = "ami-0dee22c13ea7a9a67"
  instance_type          = "c7i-flex.large"
  key_name               = var.v3_key_name
  subnet_id              = aws_subnet.subnet_v3.id
  vpc_security_group_ids = [aws_security_group.devops_sg_v3.id]

  user_data = <<-EOF
              #!/bin/bash
              sysctl -w vm.max_map_count=524288
              echo "vm.max_map_count=524288" >> /etc/sysctl.conf
              apt-get update -y
              apt-get install -y docker.io
              systemctl start docker
              usermod -aG docker ubuntu
              docker run -d --name sonarqube --restart always -p 9000:9000 sonarqube:community
              EOF

  tags = { Name = "SonarQubeServer-Stack3" }
}

# --- 5. GRAFANA SERVER ---
resource "aws_instance" "grafana_v3" {
  ami                    = "ami-0dee22c13ea7a9a67"
  instance_type          = "m7i-flex.large"
  key_name               = var.v3_key_name
  subnet_id              = aws_subnet.subnet_v3.id
  vpc_security_group_ids = [aws_security_group.devops_sg_v3.id]

  user_data = <<-EOF
              #!/bin/bash
              apt-get update -y
              apt-get install -y docker.io
              systemctl start docker
              usermod -aG docker ubuntu
              docker run -d --name grafana --restart always -p 3000:3000 grafana/grafana:latest
              EOF

  tags = { Name = "GrafanaServer-Stack3" }
}