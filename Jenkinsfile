pipeline {
    agent any
    
    options {
        skipDefaultCheckout(true) 
        timeout(time: 1, unit: 'HOURS') 
    }

    environment {
        FRONTEND_IMAGE      = "prudhviraj310/ecommerce-frontend"
        BACKEND_IMAGE       = "prudhviraj310/ecommerce-backend"
        DOCKER_TAG          = "${BUILD_NUMBER}"
        DOCKER_HUB_CREDS_ID = 'docker-hub-creds'
        API_URL             = "http://3.111.170.86:5000/api" 
        NOTIFY_EMAIL        = "prudhviraj7675@gmail.com" 
    }

    stages {
        stage('Cleanup & Prep') {
            steps {
                script {
                    echo "Force clearing existing containers to prevent conflicts..."
                    sh "docker rm -f ecommerce-backend ecommerce-frontend mysql-db || true"
                    deleteDir() 
                    checkout scm 
                }
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    echo "Building Images with Build Number and Latest tags..."
                    // Build Frontend with API_URL build-arg
                    sh "docker build -t ${FRONTEND_IMAGE}:${DOCKER_TAG} -t ${FRONTEND_IMAGE}:latest -f Dockerfile.frontend --build-arg REACT_APP_API_URL=${API_URL} ."
                    // Build Backend
                    sh "docker build -t ${BACKEND_IMAGE}:${DOCKER_TAG} -t ${BACKEND_IMAGE}:latest -f Dockerfile.backend ."
                    
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_CREDS_ID}", passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo '${PASS}' | docker login -u ${USER} --password-stdin"
                        
                        // Push Build Number tags
                        sh "docker push ${FRONTEND_IMAGE}:${DOCKER_TAG}"
                        sh "docker push ${BACKEND_IMAGE}:${DOCKER_TAG}"
                        
                        // Push Latest tags (This ensures docker-compose always gets the newest code)
                        sh "docker push ${FRONTEND_IMAGE}:latest"
                        sh "docker push ${BACKEND_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo "Deploying with Compose..."
                    // Force pull to ensure the ':latest' image is updated from Docker Hub
                    sh "docker compose pull"
                    sh "API_URL=${API_URL} docker compose up -d --force-recreate"
                }
            }
        }

        stage('Space Cleanup') {
            steps {
                script {
                    echo "Removing local build images to save disk space..."
                    sh "docker rmi ${FRONTEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:${DOCKER_TAG} || true"
                    sh "docker image prune -f --filter 'until=24h'" 
                }
            }
        }
    }

    post {
        always {
            emailext (
                to: "${env.NOTIFY_EMAIL}",
                subject: "Build ${currentBuild.fullDisplayName} - ${currentBuild.result}",
                body: "Project: ${env.JOB_NAME}\nStatus: ${currentBuild.result}\nLogs: ${env.BUILD_URL}",
                attachLog: true
            )
            cleanWs()
        }
    }
}