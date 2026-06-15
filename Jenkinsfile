// Student Hub - primary CI/CD pipeline
// Configured for a Jenkins controller running on WINDOWS (uses 'bat' steps).
//
// Required Jenkins plugins:  OWASP Dependency-Check, SonarQube Scanner, Docker Pipeline,
//                            Credentials Binding.
// Required Jenkins config:
//   - Tools:        a Dependency-Check install named 'dependency-check'
//                   a SonarQube Scanner install named 'sonar-scanner'
//   - System:       a SonarQube server named 'MySonarQube'
//   - Credentials (Secret text unless noted):
//                   'dockerhub'             - Username/password (Docker Hub user + Read/Write token)
//                   'nvd-api-key'           - NVD API key for Dependency-Check
//                   'az-sp-appid'           - Azure service principal appId
//                   'az-sp-password'        - Azure service principal password
//                   'az-sp-tenant'          - Azure tenant ID
//                   'supabase-url'          - Supabase project URL
//                   'supabase-service-role' - Supabase service role key
//                   'groq-api-key'          - Groq API key
//                   'jwt-secret-key'        - JWT signing secret (same as backend/.env SECRET_KEY)
//                   'vercel-deploy-hook'    - Vercel Deploy Hook URL for the frontend project
//   - Docker Desktop must be running and 'docker' on PATH for the Jenkins service account.
//   - Azure CLI ('az') must be installed and on PATH for the Jenkins service account.

pipeline {
  agent any

  environment {
    IMAGE_BACKEND  = "shash1278/studenthub-backend"
    IMAGE_FRONTEND = "shash1278/studenthub-frontend"
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Dependency Check') {                         // <-- the Dependency Check
      steps {
        // NVD API key kept out of the repo: stored as a Jenkins 'Secret text'
        // credential with ID 'nvd-api-key'.
        withCredentials([string(credentialsId: 'nvd-api-key', variable: 'NVD_API_KEY')]) {
          dependencyCheck additionalArguments: "--scan ./ --format HTML --format XML --nvdApiKey ${NVD_API_KEY}",
                          odcInstallation: 'dependency-check'
        }
      }
      post {
        always {
          dependencyCheckPublisher pattern: '**/dependency-check-report.xml'
        }
      }
    }

    stage('SonarQube Analysis') {                       // <-- the Security/Vulnerability Check
      steps {
        withSonarQubeEnv('MySonarQube') {
          bat "\"${tool('sonar-scanner')}\\bin\\sonar-scanner.bat\""
        }
      }
    }

    stage('Docker Build') {
      steps {
        bat "docker build -t ${IMAGE_BACKEND}:${BUILD_NUMBER} -t ${IMAGE_BACKEND}:latest ./backend"
        bat "docker build -t ${IMAGE_FRONTEND}:${BUILD_NUMBER} -t ${IMAGE_FRONTEND}:latest ./frontend"
      }
    }

    stage('Docker Push') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'dockerhub',
                                          usernameVariable: 'DH_USER',
                                          passwordVariable: 'DH_PASS')]) {
          bat 'echo %DH_PASS%| docker login -u %DH_USER% --password-stdin'
          bat "docker push ${IMAGE_BACKEND}:${BUILD_NUMBER}"
          bat "docker push ${IMAGE_BACKEND}:latest"
          bat "docker push ${IMAGE_FRONTEND}:${BUILD_NUMBER}"
          bat "docker push ${IMAGE_FRONTEND}:latest"
        }
      }
    }

    stage('Deploy') {                                   // <-- redeploy backend + frontend
      parallel {
        stage('Backend (Azure ACI)') {
          steps {
            withCredentials([
              string(credentialsId: 'az-sp-appid',           variable: 'AZ_APP_ID'),
              string(credentialsId: 'az-sp-password',        variable: 'AZ_PASSWORD'),
              string(credentialsId: 'az-sp-tenant',          variable: 'AZ_TENANT'),
              string(credentialsId: 'supabase-url',          variable: 'SUPABASE_URL'),
              string(credentialsId: 'supabase-service-role', variable: 'SUPABASE_SERVICE_ROLE_KEY'),
              string(credentialsId: 'groq-api-key',          variable: 'GROQ_API_KEY'),
              string(credentialsId: 'jwt-secret-key',        variable: 'SECRET_KEY')
            ]) {
              bat '''
                az login --service-principal -u %AZ_APP_ID% -p %AZ_PASSWORD% --tenant %AZ_TENANT%
                az container delete -g studenthub-rg -n studenthub-backend --yes
                az container create -g studenthub-rg -n studenthub-backend ^
                  --image shash1278/studenthub-backend:latest ^
                  --os-type Linux --cpu 1 --memory 1.5 ^
                  --dns-name-label studenthub-api-sh1278 --ports 8000 ^
                  --secure-environment-variables ^
                    SUPABASE_URL=%SUPABASE_URL% ^
                    SUPABASE_SERVICE_ROLE_KEY=%SUPABASE_SERVICE_ROLE_KEY% ^
                    GROQ_API_KEY=%GROQ_API_KEY% ^
                    SECRET_KEY=%SECRET_KEY% ^
                  --environment-variables ^
                    CORS_ORIGINS=https://devops-lab-delta.vercel.app,http://localhost:3000
                az logout
              '''
            }
          }
        }
        stage('Frontend (Vercel)') {
          steps {
            withCredentials([string(credentialsId: 'vercel-deploy-hook', variable: 'VERCEL_HOOK')]) {
              bat 'curl -X POST "%VERCEL_HOOK%"'
            }
          }
        }
      }
    }
  }

  post {
    always  { bat returnStatus: true, script: 'docker logout' }
    success { echo 'Pipeline complete - images pushed to Docker Hub and redeployed to Azure + Vercel.' }
    failure { echo 'Pipeline failed - check the stage logs above.' }
  }
}
