const { faker } = require('@faker-js/faker');
const AWS = require('aws-sdk');

AWS.config.update({ region: 'us-east-1' });
const dynamoDB = new AWS.DynamoDB.DocumentClient();

const generateFakeEC2Instances = (count) => {
    const instances = [];
    for (let i = 0; i < count; i++) {
        instances.push({
            instanceId: faker.datatype.uuid(),
            instanceType: faker.helpers.arrayElement(['t2.micro', 't2.small', 't2.medium']),
            availabilityZone: faker.helpers.arrayElement(['us-east-1a', 'us-east-1b', 'us-east-1c']),
            publicIp: faker.internet.ip(),
            privateIp: faker.internet.ip(),
            state: faker.helpers.arrayElement(['running', 'stopped']),
            role: faker.helpers.arrayElement(['DevOps', 'Developer']),
            name: faker.internet.domainWord()
        });
    }
    return instances;
};

const fakeInstances = generateFakeEC2Instances(100);

const storeFakeInstances = async () => {
    for (const instance of fakeInstances) {
      const params = {
        TableName: 'EC2Instances',
        Item: instance
      };
      try {
        await dynamoDB.put(params).promise();
        console.log(`Stored instance ${instance.instanceId}`);
      } catch (err) {
        console.error(`Error storing instance ${instance.instanceId}`, err);
      }
    }
};
  
storeFakeInstances();