pipeline {
    agent any

    environment {
        Token = credentials('GITHUB_TOKEN')  // Fetch GitHub token from Jenkins credentials
    }


    stages {
        stage('Clone Repository') {
            steps {
                git url: 'https://github.com/BackendsByMTT/Betting_Platform_NodeJS', branch: 'dev'
            }
        }

        stage('Setup Environment') {
            steps {
                script {
                    // Install dependencies
                    sh 'npm install'
                }
            }
        }

        stage('Build') {
            steps {
                script {
                    // Build the project and handle errors
                    catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                        sh 'npm run build'
                    }
                }
            }
        }

        stage('Push Artifact') {
            when {
                expression { currentBuild.currentResult == 'SUCCESS' }
            }
            steps {
                script {
                    sh '''
                     git init
                     git config user.email "rahulrawat.trippybug@gmail.com"
                     git config user.name "TrippyRahul"

                     # Copy the src folder and app.js to the root of the workspace
                     cp -r dist/src .
                     cp dist/app.js .

                     # Add only src folder and app.js to the commit
                     git add src app.js 

                     if [ -n "$(git status --porcelain)" ]; then
                        git commit -m "Add build"
                        git branch -M dev-build
                        git remote set-url origin https://github.com/BackendsByMTT/Betting_Platform_NodeJS
                        git push https://${Token}@github.com/BackendsByMTT/Betting_Platform_NodeJS dev-build --force
                     else
                        echo 'No changes to commit'
                     fi
                    '''
                }
            }
        }
    }
}