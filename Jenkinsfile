pipeline {
    agent any
    
    options {
        timeout(time: 1, unit: 'HOURS')
        skipDefaultCheckout(true) 
    }

    environment {
        FRONTEND_IMAGE = "prudhviraj310/ecommerce-frontend"
        BACKEND_IMAGE  = "prudhviraj310/ecommerce-backend"
        DOCKER_HUB_ID  = 'docker-hub-creds'
        // CRITICAL: Double check this matches your current EC2 Public IP
        API_URL        = "http://13.201.127.202:5000/api" 
    }

    stages {
        stage('Cleanup & Workspace Prep') {
            steps {
                script {
                    echo "Cleaning workspace and old containers..."
                    deleteDir() 
                    // Remove old containers to prevent port conflicts
                    sh "docker rm -f ecommerce-backend ecommerce-frontend mysql-db || true"
                    checkout scm
                }
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    echo "Building and Pushing Images..."
                    // Frontend build with environment variable injection
                    sh "docker build -t ${FRONTEND_IMAGE}:latest -f Dockerfile.frontend --build-arg REACT_APP_API_URL=${API_URL} ."
                    sh "docker build -t ${BACKEND_IMAGE}:latest -f Dockerfile.backend ."
                    
                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_ID}", passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo '${PASS}' | docker login -u ${USER} --password-stdin"
                        sh "docker push ${FRONTEND_IMAGE}:latest"
                        sh "docker push ${BACKEND_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    echo "Locating docker-compose and deploying..."
                    
                    // This dynamic command finds docker-compose even if it's in /usr/bin or /usr/local/bin
                    def composePath = sh(script: "which docker-compose || (ls /usr/bin/docker-compose 2>/dev/null) || (ls /usr/local/bin/docker-compose 2>/dev/null)", returnStdout: true).trim()
                    
                    if (!composePath) {
                        error "Senior Engineer Note: docker-compose NOT found in container. Please check your '-v' mapping in the docker run command."
                    }

                    echo "Using docker-compose located at: ${composePath}"
                    
                    // Pull the fresh images we just pushed
                    sh "${composePath} pull"
                    
                    // Deploy the stack
                    sh "API_URL=${API_URL} ${composePath} up -d --force-recreate"
                }
            }
        }
    }

    post {
        success {
            echo "-----------------------------------------------------------"
            echo "SUCCESS! App is live: http://13.201.127.202:3000"
            echo "-----------------------------------------------------------"
        }
        failure {
            echo "-----------------------------------------------------------"
            echo "DEPLOYMENT FAILED."
            echo "Senior Engineer Tip: Run 'docker ps' on AWS to see if Jenkins is running."
            echo "Ensure you mapped: -v /usr/bin/docker-compose:/usr/bin/docker-compose"
            echo "-----------------------------------------------------------"
        }
    }
}