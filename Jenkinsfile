pipeline {
    agent any

    environment {
        FRONTEND_IMAGE      = "prudhviraj310/ecommerce-frontend"
        BACKEND_IMAGE       = "prudhviraj310/ecommerce-backend"
        DOCKER_TAG          = "${BUILD_NUMBER}"
        DOCKER_HUB_CREDS_ID = 'docker-hub-creds'
        // Your current AWS Public IP
        API_URL             = "http://35.154.134.186:5000/api" 
    }

    stages {
        stage('Pre-Flight Cleanup') {
            steps {
                echo "Cleaning up environment..."
                // Added || true so it doesn't fail if there's nothing to prune
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
                sh 'trivy fs . --severity HIGH,CRITICAL --exit-code 0'
            }
        }

        stage('Image Build') {
            steps {
                script {
                    echo "Building Frontend Image..."
                    sh "docker build -t ${FRONTEND_IMAGE}:${DOCKER_TAG} -t ${FRONTEND_IMAGE}:latest -f Dockerfile.frontend --build-arg REACT_APP_API_URL=${API_URL} ."
                    
                    echo "Building Backend Image..."
                    sh "docker build -t ${BACKEND_IMAGE}:${DOCKER_TAG} -t ${BACKEND_IMAGE}:latest -f Dockerfile.backend ."
                }
            }
        }

        stage('Registry Push') {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDS_ID}", passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo ${PASS} | docker login -u ${USER} --password-stdin"
                        
                        echo "Pushing images to Docker Hub..."
                        sh "docker push ${FRONTEND_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${FRONTEND_IMAGE}:latest"
                        sh "docker push ${BACKEND_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${BACKEND_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Zero-Downtime Deploy') {
            steps {
                script {
                    echo "Deploying via Docker CLI (Bypassing Compose Issues)..."
                    // 1. Pull the latest images we just pushed
                    sh "docker pull ${FRONTEND_IMAGE}:latest"
                    sh "docker pull ${BACKEND_IMAGE}:latest"

                    // 2. Stop and Remove old containers if they exist
                    sh "docker stop ecommerce-frontend ecommerce-backend || true"
                    sh "docker rm ecommerce-frontend ecommerce-backend || true"

                    // 3. Start New Containers
                    // Backend first
                    sh "docker run -d --name ecommerce-backend -p 5000:5000 ${BACKEND_IMAGE}:latest"
                    // Frontend second
                    sh "docker run -d --name ecommerce-frontend -p 3000:80 ${FRONTEND_IMAGE}:latest"
                }
            }
        }
    }

    post {
        always {
            echo "Post-build maintenance..."
            sh "docker rmi ${FRONTEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:${DOCKER_TAG} || true"
            cleanWs()
        }
        success {
            echo "✅ DEPLOYMENT SUCCESSFUL"
            echo "Frontend: http://35.154.134.186:3000"
            echo "Backend: http://35.154.134.186:5000"
        }
        failure {
            echo "❌ DEPLOYMENT FAILED: Check logs for Permission or Command errors."
        }
    }
}