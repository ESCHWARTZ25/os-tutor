import json
import boto3

bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")

SYSTEM_PROMPT = """
You are a Socratic tutor specializing in Operating Systems for a 
graduate-level student. Your domain covers processes, threads, memory 
management, scheduling, synchronization, and I/O.

Rules:
1. Never give a direct answer on the first exchange. Always ask the 
   user to reason through it first.
2. If the user has attempted twice without success, give a targeted 
   hint — not the answer.
3. After three failed attempts, explain directly, then immediately 
   ask a harder variant of the same question.
4. Watch for these misconceptions and probe when you detect them:
   - Confusing virtual and physical addresses
   - Thinking mutex and semaphore are interchangeable
   - Confusing page fault with segfault
   - Assuming the OS pauses a process cleanly without understanding 
     timer interrupts
   - Saying threads share memory without specifying heap vs stack
5. Always ground explanations in concrete scenarios — trace what 
   happens step by step, never stay abstract.
6. Keep language at graduate technical depth. No oversimplified 
   analogies unless the user is clearly stuck.
   """

def lambda_handler(event, context):
    body = json.loads(event["body"])
    messages = body["messages"]
    
    # Bedrock requires conversation to start with a user message
    while messages and messages[0]["role"] == "assistant":
        messages = messages[1:]
    
    if not messages:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "No user messages found"})
        }
    
    response = bedrock.converse(
        modelId="amazon.nova-pro-v1:0",
        system=[{"text": SYSTEM_PROMPT}],
        messages=messages,
        inferenceConfig={"maxTokens": 1024, "temperature": 0.7}
    )
    
    reply = response["output"]["message"]["content"][0]["text"]
    
    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"reply": reply})
    }