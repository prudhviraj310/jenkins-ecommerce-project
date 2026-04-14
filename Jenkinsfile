pipeline {
    agent any

    environment {
        FRONTEND_IMAGE      = "prudhviraj310/ecommerce-frontend"
        BACKEND_IMAGE       = "prudhviraj310/ecommerce-backend"
        DOCKER_TAG          = "${BUILD_NUMBER}"
        DOCKER_HUB_CREDS_ID = 'docker-hub-creds'
        API_URL             = "http://35.154.134.186:5000/api" 
        NOTIFY_EMAIL        = "prudhviraj7675@gmail.com" 
    }

    stages {
        stage('Workspace Reset') {
            steps {
                echo "Wiping workspace to fix Git corruption..."
                // This deletes everything in the folder BEFORE we try to clone
                deleteDir() 
            }
        }

        stage('Environment Audit') {
            steps {
                sh "whoami && docker --version && docker compose version || true"
            }
        }

        stage('Source Checkout') {
            steps {
                // Now that the folder is empty, checkout will perform a fresh clone
                checkout scm
            }
        }

        stage('Pre-Flight Cleanup') {
            steps {
                echo "Cleaning up Docker to prevent storage issues..."
                sh "docker system prune -af --volumes || true"
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
                    // Using modern 'docker compose' V2 syntax
                    sh "API_URL=${API_URL} docker compose pull"
                    sh "API_URL=${API_URL} docker compose up -d --force-recreate"
                    sh "docker ps"
                }
            }
        }
    }

    post {
        always {
            echo "Post-build maintenance..."
            // Remove local build-specific images to save space
            sh "docker rmi ${FRONTEND_IMAGE}:${DOCKER_TAG} ${BACKEND_IMAGE}:${DOCKER_TAG} || true"
            
            emailext (
                to: "${env.NOTIFY_EMAIL}",
                subject: "Build ${currentBuild.fullDisplayName} - Status: ${currentBuild.result}",
                body: """Build Status: ${currentBuild.result}
                        Project: ${env.JOB_NAME}
                        Build Number: ${env.BUILD_NUMBER}
                        Check logs here: ${env.BUILD_URL}""",
                attachLog: true
            )
            cleanWs()
        }
        success {
            echo "✅ DEPLOYMENT SUCCESSFUL"
        }
        failure {
            echo "❌ DEPLOYMENT FAILED"
        }
    }
}