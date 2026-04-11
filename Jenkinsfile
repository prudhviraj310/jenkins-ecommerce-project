pipeline {
    agent any

    environment {
        // Defining variables for easier updates
        DOCKER_IMAGE = "prudhviraj7675/ecommerce-app"
        DOCKER_TAG = "${BUILD_NUMBER}"
        
        // Use underscores here. This variable holds the "String" ID from your UI.
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
                    // We call the variable DOCKER_HUB_CREDS_ID which contains the string 'docker-hub-creds'
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
            // Cleanup space to keep your 20GB disk healthy
            sh "docker rmi ${DOCKER_IMAGE}:${DOCKER_TAG} || true"
            sh "docker system prune -f"
            cleanWs()
        }
        success {
            echo "Pipeline Successful! Image pushed to Docker Hub."
        }
        failure {
            echo "Pipeline Failed. Check logs for Credential or Network errors."
        }
    }
}