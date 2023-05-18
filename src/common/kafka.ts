import { Message } from "kafkajs";
import {
  CompressionTypes,
  Kafka,
  KafkaConfig,
  Producer,
  ProducerConfig,
  ProducerRecord,
} from "kafkajs";

const kafkaConfig: KafkaConfig = {
  brokers: ["localhost:9092"],
};

const kafka = new Kafka(kafkaConfig);

const producerConfig: ProducerConfig = {
  retry: {
    /*
    maxRetryTime?: 1000,
    initialRetryTime?: 1000 
    factor?: 2,
    multiplier?: 10,
    retries?: 5,
    },
    */
  },
  maxInFlightRequests: 20,
};

export class EventProducer {
  private producer: Producer;

  constructor() {
    this.producer = kafka.producer(producerConfig);
    this.producer.connect;
  }

  async send(event: Record<string, any>, key = "info") {
    await this.producer.connect();

    const msg: Message = {
      key: key,
      // value: event.toString(),
      value: Buffer.from(JSON.stringify(event)),
      timestamp: new Date().valueOf().toString(),
    };

    const record: ProducerRecord = {
      topic: "coffee",
      messages: [msg],
      acks: 1,
      timeout: 10000,
      compression: CompressionTypes.None,
    };

    await this.producer.send(record);
  }
}

const eventProducer = new EventProducer();

export const emitEvent = async (event: Record<string, any>) => {
  await eventProducer.send({ event });
};
