pipeline {
    agent any
    
    options {
        timeout(time: 1, unit: 'HOURS')
        buildDiscarder(logRotator(numToKeepStr: '5'))
    }

    environment {
        // Docker Hub details
        FRONTEND_IMAGE = "prudhviraj310/ecommerce-frontend"
        BACKEND_IMAGE  = "prudhviraj310/ecommerce-backend"
        DOCKER_HUB_ID  = 'docker-hub-creds'
        
        // Networking & IPs
        // Jenkins Server: 13.232.223.27
        API_URL        = "http://13.232.223.27:5000/api" 
        
        // SonarQube Details
        SONAR_SERVER_ID = 'sonar-server' 
        SONAR_URL       = "http://3.109.144.110:9000"
        
        // Database Credentials ID
        DB_PASS_ID      = 'MYSQL_DB_PASS'
    }

    stages {
        stage('Cleanup & Workspace Prep') {
            steps {
                script {
                    deleteDir() 
                    sh "docker rm -f ecommerce-backend ecommerce-frontend mysql-db || true"
                    checkout scm
                }
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'sonar-scanner' 
                    withSonarQubeEnv("${SONAR_SERVER_ID}") {
                        sh "${scannerHome}/bin/sonar-scanner \
                        -Dsonar.projectKey=ecommerce-migration \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=${SONAR_URL}"
                    }
                }
            }
        }

        stage('Security Scan (Trivy FS)') {
            steps {
                echo "Scanning File System for vulnerabilities..."
                sh "trivy fs --severity HIGH,CRITICAL ."
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    // Frontend build with the build-arg for React
                    sh "docker build -t ${FRONTEND_IMAGE}:latest -f Dockerfile.frontend --build-arg REACT_APP_API_URL=${API_URL} ."
                    
                    // Backend build
                    sh "docker build -t ${BACKEND_IMAGE}:latest -f Dockerfile.backend ."
                    
                    // Security scan for images
                    sh "trivy image --severity HIGH,CRITICAL ${FRONTEND_IMAGE}:latest"

                    withCredentials([usernamePassword(credentialsId: "${DOCKER_HUB_ID}", passwordVariable: 'PASS', usernameVariable: 'USER')]) {
                        sh "echo '${PASS}' | docker login -u ${USER} --password-stdin"
                        sh "docker push ${FRONTEND_IMAGE}:latest"
                        sh "docker push ${BACKEND_IMAGE}:latest"
                    }
                }
            }
        }

        stage('Deploy Stack') {
            steps {
                script {
                    // Ensure Docker Compose is available
                    sh """
                        if ! command -v docker-compose &> /dev/null; then
                            curl -L "https://github.com/docker/compose/releases/download/v2.26.1/docker-compose-linux-x86_64" -o ./docker-compose
                            chmod +x ./docker-compose
                        else
                            cp \$(which docker-compose) ./docker-compose
                        fi
                    """
                    
                    // Handle MySQL credentials (Username with Password)
                    withCredentials([usernamePassword(credentialsId: "${DB_PASS_ID}", 
                                     passwordVariable: 'SQL_PW', 
                                     usernameVariable: 'SQL_USER')]) {
                        
                        sh "MYSQL_ROOT_PASSWORD=${SQL_PW} API_URL=${API_URL} ./docker-compose up -d --force-recreate"
                    }
                }
            }
        }
    }

    post {
        success {
            echo "SUCCESS: App live at http://13.232.223.27:3000"
        }
    }
}