# Architecture Documentation

This directory contains architecture diagrams and documentation for the vid_ad project.

## Tech Stack Diagram

The `tech-stack.mmd` file contains a comprehensive Mermaid diagram showing all technologies, frameworks, and services used in this project.

### Viewing the Diagram

#### Option 1: VS Code (Recommended)
1. Install the [Mermaid Preview](https://marketplace.visualstudio.com/items?itemName=vstirbu.vscode-mermaid-preview) extension
2. Open `tech-stack.mmd`
3. Right-click and select "Preview Mermaid Diagram"

#### Option 2: GitHub
- The diagram will render automatically when viewing the `.mmd` file on GitHub

#### Option 3: Online Mermaid Editor
1. Copy the contents of `tech-stack.mmd`
2. Visit https://mermaid.live
3. Paste the diagram code

#### Option 4: Markdown Files
Embed the diagram in any markdown file:
````markdown
```mermaid
<!-- Paste contents of tech-stack.mmd here -->
```
````

### Tech Stack Overview

The architecture is organized into the following layers:

#### **Frontend Layer**
- Next.js 16.0.1 with React 19.2.0
- TypeScript 5.9.3 with strict mode
- Tailwind CSS 4.1.16
- React Hook Form with Zod validation

#### **API & Routing**
- Next.js App Router with API routes
- Firebase Cloud Functions (Node.js 20)

#### **AI/ML Services**
- OpenAI GPT for ad copy generation
- Replicate for image/video ML models

#### **Firebase Platform**
- Firestore (NoSQL database)
- Firebase Storage (file storage)
- Firebase Hosting (static export)
- Firebase Authentication with AWS Cognito integration

#### **AWS Infrastructure** (Terraform-managed)
- **Compute**: EC2, ECS, ECR
- **Storage**: S3 buckets for recordings and transcripts
- **Database**: MongoDB Atlas with PrivateLink
- **Cache**: ElastiCache Redis
- **Messaging**: SQS with Dead Letter Queue
- **Monitoring**: CloudWatch (logs, metrics, alarms)
- **Auth**: Cognito User Pool
- **Search**: OpenSearch Serverless for vector search

#### **Database Layer**
- MongoDB Atlas (document database)
- Firestore (NoSQL)
- Redis (in-memory cache and Celery backend)

#### **Media Processing**
- FFmpeg 5.2.0 for video processing
- Sharp 0.33.0 for image optimization

#### **Storage Services**
- AWS S3 (media storage)
- Firebase Storage (user files)
- Google Cloud Storage (images)

#### **Development Tools**
- ESLint + Prettier (code quality)
- Turbopack (build system)
- PostCSS (CSS processing)
- Firebase Functions Test (testing)

#### **Security & Infrastructure**
- Terraform 1.5+ for Infrastructure as Code
- IAM roles for access control
- Firestore and Storage security rules
- CSRF and CORS protection

### Color Legend

- **Blue**: Frontend technologies
- **Green**: Backend services
- **Dark Green**: Database services
- **Teal**: AI/ML services
- **Orange**: AWS services
- **Yellow**: Firebase services
- **Gray**: Development tools
- **Red**: Security & infrastructure

### Updating the Diagram

To update the tech stack diagram:

1. Edit `tech-stack.mmd`
2. Follow the Mermaid graph syntax: https://mermaid.js.org/syntax/flowchart.html
3. Test your changes using one of the viewing methods above
4. Commit the updated diagram

### Additional Resources

- [Mermaid Documentation](https://mermaid.js.org/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Firebase Documentation](https://firebase.google.com/docs)
- [Terraform AWS Provider](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
