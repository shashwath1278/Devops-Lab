// Student Hub - primary CI/CD pipeline
// Configured for a Jenkins controller running on WINDOWS (uses 'bat' steps).
//
// Required Jenkins plugins:  OWASP Dependency-Check, SonarQube Scanner, Docker Pipeline,
//                            Credentials Binding.
// Required Jenkins config:
//   - Tools:        a Dependency-Check install named 'dependency-check'
//                   a SonarQube Scanner install named 'sonar-scanner'
//   - System:       a SonarQube server named 'MySonarQube'
//   - Credentials:  a Username/password credential with ID 'dockerhub'
//   - Docker Desktop must be running and 'docker' on PATH for the Jenkins service account.

pipeline {
  agent any

  environment {
    IMAGE_BACKEND  = "astroloop20/studenthub-backend"
    IMAGE_FRONTEND = "astroloop20/studenthub-frontend"
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
  }

  post {
    always  { bat returnStatus: true, script: 'docker logout' }
    success { echo 'Pipeline complete - images pushed to Docker Hub.' }
    failure { echo 'Pipeline failed - check the stage logs above.' }
  }
}
