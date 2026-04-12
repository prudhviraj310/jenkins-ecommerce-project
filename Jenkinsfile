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
                echo "Cleaning up local images..."
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
                // Scan the folders where the actual code lives
                sh 'trivy fs server/ frontend/ --severity HIGH,CRITICAL --exit-code 0'
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
                        sh "echo ${PASS} | docker login -u ${USER} --password-stdin"
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
                    echo "Deploying containers..."
                    sh "docker pull ${FRONTEND_IMAGE}:latest"
                    sh "docker pull ${BACKEND_IMAGE}:latest"
                    sh "docker stop ecommerce-frontend ecommerce-backend || true"
                    sh "docker rm ecommerce-frontend ecommerce-backend || true"
                    
                    // Deploying with bridge network or link so backend can be found if needed
                    sh "docker run -d --name ecommerce-backend -p 5000:5000 ${BACKEND_IMAGE}:latest"
                    sh "docker run -d --name ecommerce-frontend -p 3000:80 ${FRONTEND_IMAGE}:latest"
                }
            }
        }
    }

    post {
        always {
            sh "docker rmi ${FRONTEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:${DOCKER_TAG} || true"
            cleanWs()
        }
        success {
            echo "✅ DEPLOYMENT SUCCESSFUL"
        }
    }
}