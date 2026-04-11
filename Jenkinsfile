pipeline {
    agent any

    environment {
        // Defining variables for easier updates
        DOCKER_IMAGE = "prudhviraj7675/ecommerce-app"
        DOCKER_TAG = "${BUILD_NUMBER}"
        // Make sure this ID matches the one in Jenkins -> Credentials
        DOCKER_HUB_CREDS = 'docker-creds' 
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                // Scanning the filesystem before building
                sh 'trivy fs . --severity HIGH,CRITICAL'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Using standard shell to build
                    sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                    sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    // This uses the Credentials Binding plugin (which is a suggested plugin)
                    withCredentials([usernamePassword(credentialsId: "${docker-hub-creds}", passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo ${PASS} | docker login -u ${USER} --password-stdin"
                        sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${DOCKER_IMAGE}:latest"
                    }
                }
            }
        }
    }

    post {
        always {
            // CRITICAL: Cleanup space after every build so your 20GB doesn't fill up!
            sh "docker rmi ${DOCKER_IMAGE}:${DOCKER_TAG} || true"
            sh "docker system prune -f"
            cleanWs()
        }
        success {
            echo "Pipeline Successful! Image pushed to Docker Hub."
        }
        failure {
            echo "Pipeline Failed. Check logs and disk space."
        }
    }
}