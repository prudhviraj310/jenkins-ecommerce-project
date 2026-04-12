pipeline {
    agent any

    environment {
        FRONTEND_IMAGE      = "prudhviraj310/ecommerce-frontend"
        BACKEND_IMAGE       = "prudhviraj310/ecommerce-backend"
        DOCKER_TAG          = "${BUILD_NUMBER}"
        DOCKER_HUB_CREDS_ID = 'docker-hub-creds'
        API_URL             = "http://35.154.134.186:5000/api" 
    }

    stages {
        stage('Environment Audit') {
            steps {
                sh "whoami && ls -l /var/run/docker.sock || true"
            }
        }

        stage('Pre-Flight Cleanup') {
            steps {
                echo "Cleaning up local images to save space..."
                sh "docker system prune -f || true"
            }
        }

        stage('Source Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Security Gate (Trivy)') {
            steps {
                sh 'trivy fs server/ --severity HIGH,CRITICAL --exit-code 0'
                sh 'trivy fs frontend/ --severity HIGH,CRITICAL --exit-code 0'
            }
        }

        stage('Image Build') {
            steps {
                script {
                    echo "Building Frontend..."
                    sh "docker build -t ${FRONTEND_IMAGE}:${DOCKER_TAG} -t ${FRONTEND_IMAGE}:latest -f Dockerfile.frontend --build-arg REACT_APP_API_URL=${API_URL} ."
                    
                    echo "Building Backend..."
                    sh "docker build -t ${BACKEND_IMAGE}:${DOCKER_TAG} -t ${BACKEND_IMAGE}:latest -f Dockerfile.backend ."
                }
            }
        }

        stage('Registry Push') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDS_ID}", passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo '${PASS}' | docker login -u ${USER} --password-stdin"
                        sh "docker push ${FRONTEND_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${FRONTEND_IMAGE}:latest"
                        sh "docker push ${BACKEND_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${BACKEND_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Production Deployment') {
            steps {
                script {
                    echo "Deploying via Docker Compose..."
                    // Force pull latest to avoid using stale local cache
                    sh "API_URL=${API_URL} docker-compose pull"
                    // Down then Up to ensure a clean state
                    sh "API_URL=${API_URL} docker-compose down || true"
                    sh "API_URL=${API_URL} docker-compose up -d"
                    
                    sh "docker ps"
                }
            }
        }
    }

    post {
        always {
            echo "Post-build maintenance..."
            // Aggressive cleanup: removes the build-specific images to keep the server clean
            sh "docker rmi ${FRONTEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:${DOCKER_TAG} || true"
            cleanWs()
        }
        success {
            echo "✅ DEPLOYMENT SUCCESSFUL"
        }
        failure {
            echo "❌ DEPLOYMENT FAILED - Check the Registry Push or Docker Compose steps above"
        }
    }
}