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
        
        // Database Credentials ID
        DB_PASS_ID      = 'MYSQL_DB_PASS'
        
        // SonarQube Server Name (as configured in Jenkins System UI)
        SONAR_SERVER_ID = 'sonar-server' 

        /* 
           NOTE: API_URL and SONAR_URL are now pulled from 
           Jenkins Global Environment Variables to avoid hardcoding IPs.
        */
    }

    stages {
        stage('Cleanup & Workspace Prep') {
            steps {
                script {
                    deleteDir() 
                    // Attempt to clean up old containers from previous runs
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
                        // Uses the SONAR_URL defined in Global Settings
                        sh "${scannerHome}/bin/sonar-scanner \
                        -Dsonar.projectKey=ecommerce-migration \
                        -Dsonar.sources=. \
                        -Dsonar.host.url=${env.SONAR_URL}"
                    }
                }
            }
        }

        stage('Security Scan (Trivy FS)') {
            steps {
                echo "Scanning File System for vulnerabilities..."
                // Using the Trivy tool integrated into your Jenkins/Docker environment
                sh "trivy fs --severity HIGH,CRITICAL ."
            }
        }

        stage('Build & Push') {
            steps {
                script {
                    // Frontend build: Injects the dynamic API_URL into the React app
                    sh "docker build -t ${FRONTEND_IMAGE}:latest -f Dockerfile.frontend --build-arg REACT_APP_API_URL=${env.API_URL} ."
                    
                    // Backend build
                    sh "docker build -t ${BACKEND_IMAGE}:latest -f Dockerfile.backend ."
                    
                    // Security scan for images before pushing to Docker Hub
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
                    // Download/setup docker-compose for deployment
                    sh """
                        if ! command -v docker-compose &> /dev/null; then
                            curl -L "https://github.com/docker/compose/releases/download/v2.26.1/docker-compose-linux-x86_64" -o ./docker-compose
                            chmod +x ./docker-compose
                        else
                            cp \$(which docker-compose) ./docker-compose
                        fi
                    """
                    
                    withCredentials([usernamePassword(credentialsId: "${DB_PASS_ID}", 
                                     passwordVariable: 'SQL_PW', 
                                     usernameVariable: 'SQL_USER')]) {
                        
                        // Deploying the stack using the dynamic API_URL
                        sh "MYSQL_ROOT_PASSWORD=${SQL_PW} API_URL=${env.API_URL} ./docker-compose up -d --force-recreate"
                    }
                }
            }
        }
    }

    post {
        success {
            // Using env.API_URL to show the correct live link in logs
            echo "SUCCESS: App live. Frontend should be accessible at Port 3000."
        }
    }
}