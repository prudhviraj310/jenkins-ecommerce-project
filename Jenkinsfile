pipeline {
    agent any

    environment {
        FRONTEND_IMAGE = "prudhviraj310/ecommerce-frontend"
        BACKEND_IMAGE  = "prudhviraj310/ecommerce-backend"
        DOCKER_TAG     = "${BUILD_NUMBER}"
        DOCKER_HUB_CREDS_ID = 'docker-hub-creds' 
        API_URL = "http://13.201.34.71:5000/api"
        // Enables BuildKit for faster, more reliable builds
        DOCKER_BUILDKIT = '1'
    }

    stages {
        stage('System Cleanup') {
            steps {
                // Pre-emptively clear space to prevent "No space left on device"
                sh "docker system prune -f"
            }
        }

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

        stage('Build Docker Images') {
            steps {
                script {
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
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDS_ID}", passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo ${PASS} | docker login -u ${USER} --password-stdin"
                        
                        // Pushing latest first helps with layer caching
                        sh "docker push ${FRONTEND_IMAGE}:latest"
                        sh "docker push ${FRONTEND_IMAGE}:${DOCKER_TAG}"
                        
                        sh "docker push ${BACKEND_IMAGE}:latest"
                        sh "docker push ${BACKEND_IMAGE}:${DOCKER_TAG}"
                    }
                }
            }
        }

        stage('Deploy to AWS') {
            steps {
                script {
                    // Pull and restart
                    sh "docker compose pull"
                    sh "docker compose up -d"
                }
            }
        }
    }

    post {
        always {
            // Aggressive cleanup to keep your 20GB disk healthy
            sh "docker rmi ${FRONTEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:${DOCKER_TAG} || true"
            sh "docker image prune -f"
            cleanWs()
        }
        success {
            echo "SUCCESS: Deployment complete. Check http://13.201.34.71:3000"
        }
        failure {
            echo "FAILURE: Check the Console Output. If it's a timeout, just click 'Build Now' again."
        }
    }
}