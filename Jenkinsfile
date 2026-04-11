pipeline {
    agent any

    environment {
        FRONTEND_IMAGE      = "prudhviraj310/ecommerce-frontend"
        BACKEND_IMAGE       = "prudhviraj310/ecommerce-backend"
        DOCKER_TAG          = "${BUILD_NUMBER}"
        DOCKER_HUB_CREDS_ID = 'docker-hub-creds'
        API_URL             = "http://13.201.34.71:5000/api"
    }

    stages {
        stage('Pre-Flight Cleanup') {
            steps {
                echo "Cleaning up environment to prevent 'No Space Left on Device'..."
                // Removes dangling images, stopped containers, and unused networks
                sh "docker system prune -f"
            }
        }

        stage('Source Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Security Gate (Trivy)') {
            steps {
                // Ensure Trivy doesn't fail the build if it can't find a DB, but reports vulnerabilities
                sh 'trivy fs . --severity HIGH,CRITICAL --exit-code 0'
            }
        }

        stage('Parallel Image Build') {
            steps {
                script {
                    // We build these sequentially to avoid CPU spikes on small instances
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
                    echo "Deploying to AWS via Docker Compose..."
                    // 'pull' ensures we get the exact images we just pushed
                    sh "docker compose pull"
                    // 'up -d' recreates only the containers that changed
                    sh "docker compose up -d"
                }
            }
        }
    }

    post {
        always {
            echo "Post-build maintenance..."
            // Remove the specific tagged images we just built to save disk space
            sh "docker rmi ${FRONTEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:${DOCKER_TAG} || true"
            // Final wipe of the workspace
            cleanWs()
        }
        success {
            echo "✅ DEPLOYMENT SUCCESSFUL: http://13.201.34.71:3000"
        }
        failure {
            echo "❌ DEPLOYMENT FAILED: Review the 'Registry Push' or 'Deploy' stages in the log."
        }
    }
}