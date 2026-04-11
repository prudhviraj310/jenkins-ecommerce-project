pipeline {
    agent any

    environment {
        // Image names for your Docker Hub repositories
        FRONTEND_IMAGE = "prudhviraj310/ecommerce-frontend"
        BACKEND_IMAGE  = "prudhviraj310/ecommerce-backend"
        DOCKER_TAG     = "${BUILD_NUMBER}"
        
        // The ID of the credentials you created in Jenkins UI
        DOCKER_HUB_CREDS_ID = 'docker-hub-creds' 
        
        // This IP is baked into the React build so it knows where the API lives
        API_URL = "http://13.201.34.71:5000/api"
    }

    stages {
        stage('System Cleanup') {
            steps {
                // Clears space before starting to prevent "No space left on device" errors
                sh "docker system prune -f"
            }
        }

        stage('Checkout Code') {
            steps {
                // Pulls the latest code from your GitHub repository
                checkout scm
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                // Scans the project files for security vulnerabilities
                sh 'trivy fs . --severity HIGH,CRITICAL'
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    // Build Frontend - using the specific Dockerfile and passing the API URL
                    sh "docker build -t ${FRONTEND_IMAGE}:${DOCKER_TAG} -t ${FRONTEND_IMAGE}:latest -f Dockerfile.frontend --build-arg REACT_APP_API_URL=${API_URL} ."
                    
                    // Build Backend
                    sh "docker build -t ${BACKEND_IMAGE}:${DOCKER_TAG} -t ${BACKEND_IMAGE}:latest -f Dockerfile.backend ."
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    // Log in to Docker Hub using Jenkins credentials
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDS_ID}", passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo ${PASS} | docker login -u ${USER} --password-stdin"
                        
                        // Push Frontend images (both the build number and 'latest')
                        sh "docker push ${FRONTEND_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${FRONTEND_IMAGE}:latest"
                        
                        // Push Backend images (both the build number and 'latest')
                        sh "docker push ${BACKEND_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${BACKEND_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Deploy to AWS') {
            steps {
                script {
                    // Pull the fresh images from Docker Hub to the server
                    sh "docker compose pull"
                    // Restart the containers in detached mode
                    sh "docker compose up -d"
                }
            }
        }
    }

    post {
        always {
            // Remove the local build images to keep the server clean
            sh "docker rmi ${FRONTEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:${DOCKER_TAG} || true"
            sh "docker image prune -f"
            // Wipe the workspace folder to prepare for the next run
            cleanWs()
        }
        success {
            echo "SUCCESS: Deployment complete. View your app at http://13.201.34.71:3000"
        }
        failure {
            echo "FAILURE: The pipeline failed. Please check the Console Output above for the error message."
        }
    }
}