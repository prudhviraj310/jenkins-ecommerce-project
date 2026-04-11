output "Jenkins_Public_IP_V3" { value = aws_instance.jenkins_v3.public_ip }
output "Sonar_Public_IP_V3" { value = aws_instance.sonarqube_v3.public_ip }
output "Grafana_Public_IP_V3" { value = aws_instance.grafana_v3.public_ip }