# OS Tutor

A Socratic learning assistant for Operating Systems concepts, built on AWS Bedrock. Rather than answering questions directly, the tutor guides you through reasoning problems yourself — probing your assumptions, catching common misconceptions, and only explaining directly after repeated failed attempts.

Live demo: http://os-tutor-frontend.s3-website.us-east-2.amazonaws.com

---

## Motivation

Most AI chat tools answer questions immediately. That's useful for looking things up, but it's a poor way to learn systems-level material. Operating Systems concepts — virtual memory, scheduling, synchronization — require building accurate mental models, not retrieving facts. A tool that just answers "what is a page fault?" teaches you nothing about how to reason through memory management under pressure.

This project applies the Socratic method: the model asks you to reason first, calibrates its hints based on how many attempts you've made, and watches for specific misconceptions that commonly trip up students approaching the material for the first time at the graduate level.

---

## Architecture

```
React Frontend (S3 static hosting)
        ↓
API Gateway (HTTP API, POST /chat)
        ↓
AWS Lambda (Python 3.12)
        ↓
Amazon Bedrock (Amazon Nova Pro via Converse API)
```

**Frontend:** React single-page application hosted on S3 with static website hosting. Maintains full conversation history in component state and passes it on every request, giving the model complete context without any server-side session management.

**API Gateway:** HTTP API with a single POST /chat route. CORS configured to allow browser requests from any origin.

**Lambda:** Stateless Python function that receives the conversation history, strips any leading assistant messages (Bedrock's Converse API requires conversations to begin with a user turn), and forwards the request to Bedrock. Timeout set to 30 seconds to accommodate model inference latency.

**Bedrock:** Amazon Nova Pro invoked via the Converse API. Nova Pro is a first-party AWS model requiring no additional access request, and the Converse API provides a model-agnostic interface — switching to a different model is a one-line change to the `modelId` parameter.

---

## System Prompt Design

The behavior of the tutor is driven almost entirely by the system prompt rather than application logic. Key design decisions:

**Attempt-based hint calibration:** The model is instructed to withhold direct answers on the first exchange, provide a targeted hint after two failed attempts, and only explain directly after three — immediately followed by a harder variant of the same question to prevent passive learning.

**Misconception watch list:** Common OS misconceptions are explicitly enumerated in the prompt so the model probes for them rather than waiting for the student to surface them. These include confusing virtual and physical addresses, conflating mutex and semaphore semantics, and misunderstanding what preemption actually does at the hardware level.

**Concrete grounding rule:** The model is instructed to always anchor explanations in step-by-step concrete scenarios rather than staying abstract. "What happens when the CPU executes a load instruction targeting an unmapped virtual address" is more useful than "a page fault is when..."

**Graduate depth calibration:** The prompt specifies graduate technical depth and discourages oversimplified analogies unless the user is clearly lost, avoiding the condescension that makes general-purpose tutoring tools frustrating for technically experienced learners.

---

## AWS Services Used

- **Amazon Bedrock** — model inference via the Converse API (Amazon Nova Pro)
- **AWS Lambda** — serverless compute for the API handler
- **Amazon API Gateway** — HTTP API endpoint with CORS
- **Amazon S3** — static frontend hosting
- **AWS CloudWatch** — Lambda logging and monitoring
- **AWS IAM** — execution role with Bedrock invocation permissions

---

## Running Locally

Clone the repo and install frontend dependencies:

```bash
git clone <your-repo-url>
cd os-tutor
npm install
```

Set your API Gateway endpoint:

```bash
# In src/App.js, update:
const API_URL = "https://your-api-id.execute-api.us-east-2.amazonaws.com/chat";
```

Start the development server:

```bash
npm start
```

For the backend, deploy the Lambda function in `lambda/lambda_function.py` with the `AmazonBedrockFullAccess` policy attached to its execution role, and ensure Nova Pro model access is enabled in your Bedrock console.

---

## What I'd Add in Production

- **CloudFront** in front of S3 for HTTPS and edge caching
- **DynamoDB** for persistent session history across browser refreshes
- **Concept tracker** — a Lambda action group that logs which topics have been covered and adjusts question difficulty accordingly
- **Problem bank** — a curated set of structured questions mapped to the OS concept dependency graph, pulled dynamically rather than relying on the model to generate them
- **Authentication** — Cognito or a simple API key to prevent open abuse of the Bedrock endpoint
