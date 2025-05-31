import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsReadToMessage1732828800000 implements MigrationInterface {
  name = 'AddIsReadToMessage1732828800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "message" ADD "isRead" boolean NOT NULL DEFAULT false`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "message" DROP COLUMN "isRead"`);
  }
}
