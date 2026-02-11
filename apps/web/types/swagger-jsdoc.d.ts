declare module 'swagger-jsdoc' {
  export interface Options {
    definition: object;
    apis: string[];
  }
  const swaggerJsdoc: {
    (options: Options): object;
    Options: Options;
  };
  export default swaggerJsdoc;
}
