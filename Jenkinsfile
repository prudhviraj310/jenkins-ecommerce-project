pipeline {
    agent any

    environment {
        // FIXED: Using your correct Docker Hub username here
        DOCKER_IMAGE = "prudhviraj310/ecommerce-app"
        DOCKER_TAG = "${BUILD_NUMBER}"
        
        // This variable holds the ID 'docker-hub-creds' which you have in Jenkins UI
        DOCKER_HUB_CREDS_ID = 'docker-hub-creds' 
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                sh 'trivy fs . --severity HIGH,CRITICAL'
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                    sh "docker tag ${DOCKER_IMAGE}:${DOCKER_TAG} ${DOCKER_IMAGE}:latest"
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    // This pulls the username and token from your 'docker-hub-creds'
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDS_ID}", passwordVariable: 'PASS', usernameVariable: 'USER')]) {
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
            // Housekeeping for your 20GB disk
            sh "docker rmi ${DOCKER_IMAGE}:${DOCKER_TAG} || true"
            sh "docker system prune -f"
            cleanWs()
        }
        success {
            echo "SUCCESS: Image pushed to https://hub.docker.com/u/prudhviraj310"
        }
        failure {
            echo "FAILURE: Check if the token has 'Read, Write, Delete' permissions."
        }
    }
}