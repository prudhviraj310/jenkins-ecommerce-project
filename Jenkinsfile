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
        stage('Checkout Code') {
            steps {
                // Pulls the latest code you just pushed to GitHub
                checkout scm
            }
        }

        stage('Security Scan (Trivy)') {
            steps {
                // Scans your files for vulnerabilities before building
                sh 'trivy fs . --severity HIGH,CRITICAL'
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    // FIXED: Changed to Capital 'D' to match your actual filenames
                    // Build Frontend
                    sh "docker build -t ${FRONTEND_IMAGE}:${DOCKER_TAG} -t ${FRONTEND_IMAGE}:latest -f Dockerfile.frontend --build-arg REACT_APP_API_URL=${API_URL} ."
                    
                    // Build Backend
                    sh "docker build -t ${BACKEND_IMAGE}:${DOCKER_TAG} -t ${BACKEND_IMAGE}:latest -f Dockerfile.backend ."
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    // Log in using your saved Jenkins credentials
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDS_ID}", passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo ${PASS} | docker login -u ${USER} --password-stdin"
                        
                        // Push Frontend
                        sh "docker push ${FRONTEND_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${FRONTEND_IMAGE}:latest"
                        
                        // Push Backend
                        sh "docker push ${BACKEND_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${BACKEND_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Deploy to AWS') {
            steps {
                script {
                    // Pulls new images and restarts containers using your docker-compose.yml
                    sh "docker compose pull"
                    sh "docker compose up -d"
                }
            }
        }
    }

    post {
        always {
            // Cleanup: Deletes the images from the Jenkins workspace to save disk space
            sh "docker rmi ${FRONTEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:${DOCKER_TAG} || true"
            sh "docker system prune -f"
            cleanWs()
        }
        success {
            echo "SUCCESS: Deployment complete. Check http://13.201.34.71:3000"
        }
        failure {
            echo "FAILURE: Pipeline failed. Check the Console Output for errors."
        }
    }
}