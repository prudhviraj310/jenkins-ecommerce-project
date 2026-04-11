pipeline {
    agent any

    environment {
        // Updated with your Docker Hub username
        DOCKER_IMAGE = "prudhviraj310/ecommerce-app:${env.BUILD_NUMBER}"
    }

    stages {
        stage('Checkout Code') {
            steps {
                // This tells Jenkins to use the Git credentials you added to the Dashboard
                checkout scm
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                // Scanning the filesystem for vulnerabilities
                sh "trivy fs . --severity HIGH,CRITICAL"
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Building the image using the Dockerfile in your root folder
                    sh "docker build -t ${DOCKER_IMAGE} ."
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    // This 'docker-hub-creds' must match the ID you created in Jenkins
                    docker.withRegistry('', 'docker-hub-creds') {
                        sh "docker push ${DOCKER_IMAGE}"
                    }
                }
            }
        }
    }

    post {
        always {
            // Using the Gmail configuration we just verified
            emailext (
                subject: "Build ${currentBuild.fullDisplayName}: ${currentBuild.currentResult}",
                body: """Project: ${env.JOB_NAME}
                         Build Number: ${env.BUILD_NUMBER}
                         Status: ${currentBuild.currentResult}
                         Check Console: ${env.BUILD_URL}""",
                to: 'prudhviraj310@gmail.com'
            )
        }
    }
}