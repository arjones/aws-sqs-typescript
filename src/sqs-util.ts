import { Context } from 'aws-lambda';
import { SQS, AWSError } from 'aws-sdk';
import { ReceiveMessageResult, Message } from 'aws-sdk/clients/sqs';

export class SQSUtil {
  private sqs = new SQS();

  sendMessage = async (messageBody: string, messageAttributes = {},
    queueName: string, context: Context) => {
    const queueUrl = this.getQueueUrl(queueName, context)

    const data = await this.sqs.sendMessage({
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      MessageAttributes: messageAttributes
    }).promise();

    console.log(`Message ${data.MessageId} placed in the Queue: ${queueName}`);

    return data;
  }


  getMessages = async (queueName: string, context: Context) => {
    const queueUrl = this.getQueueUrl(queueName, context)
    const params = {
      AttributeNames: ["SentTimestamp"],
      MaxNumberOfMessages: 1,
      MessageAttributeNames: ["All"],
      QueueUrl: queueUrl,
      VisibilityTimeout: 20,
      WaitTimeSeconds: 0
    };

    let messages: Message[] = [];
    try {
      const data: ReceiveMessageResult = await this.sqs.receiveMessage(params).promise()
      console.log('ReceiveMessageResult', data);

      messages = data.Messages || [];

      // Delete messages we already received
      for (const message of messages) {
        console.log('Deleting Receipt:', message.ReceiptHandle)
        const deleteParams = {
          QueueUrl: queueUrl,
          ReceiptHandle: message.ReceiptHandle
        };

        this.sqs.deleteMessage(deleteParams, function (err, data) {
          if (err) {
            console.log("deleteMessage ERROR", err);

          } else {
            console.log("Message Deleted", data);

          }
        });
      }

    } catch (error) {
      console.log(error)
    }

    console.log('messages', messages)
    return messages;
  }


  private getQueueUrl = (queueName: string, context: Context): string => {
    const region = context.invokedFunctionArn.split(':')[3];
    const accountId = context.invokedFunctionArn.split(':')[4];

    return `https://sqs.${region}.amazonaws.com/${accountId}/${queueName}`
  }

}