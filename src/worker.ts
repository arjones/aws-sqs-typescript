import { SQSHandler, SQSMessageAttributes, SQSEvent, Context } from 'aws-lambda';
import { SQSUtil } from './sqs-util'

const sqsutil = new SQSUtil()

const worker: SQSHandler = async (event: SQSEvent, context: Context) => {
  const queueForResponse = 'sqsTestTsQueueResult'
  try {
    for (const record of event.Records) {
      const messageAttributes: SQSMessageAttributes = record.messageAttributes;
      console.log('Message Attributtes -->  ', JSON.stringify(messageAttributes));
      console.log('Message Body -->  ', record.body);

      // 
      // PROCESS HERE
      const msg = JSON.parse(record.body)
      msg['originalMessageId'] = record.messageId
      
      const processedBody = JSON.stringify(msg).toUpperCase()
      // PROCESS HERE
      // 

      const data = await sqsutil.sendMessage(processedBody, {}, queueForResponse, context)
      console.log('sendMessage', data)
    }
  } catch (error) {
    console.log(error);
    sqsutil.sendMessage(error, {}, queueForResponse, context)
  }
};

export default worker;