import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateChatTableAndUpdateMessage1733000000000
  implements MigrationInterface
{
  name = 'CreateChatTableAndUpdateMessage1733000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela chats
    await queryRunner.query(`
      CREATE TABLE "chats" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "user1_id" uuid,
        "user2_id" uuid,
        CONSTRAINT "PK_chats" PRIMARY KEY ("id")
      )
    `);

    // Alterar tabela messages
    await queryRunner.query(`
      ALTER TABLE "message" 
      RENAME TO "messages"
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      ADD COLUMN "chat_id" uuid
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      ADD COLUMN "sender_id" uuid
    `);

    // Migrar dados existentes (se houver)
    // Nota: Este script assume que não há dados críticos na tabela messages
    // Em produção, você deve migrar os dados cuidadosamente

    // Remover colunas antigas
    await queryRunner.query(`
      ALTER TABLE "messages" 
      DROP CONSTRAINT IF EXISTS "FK_messages_sender"
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      DROP CONSTRAINT IF EXISTS "FK_messages_receiver"
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      DROP COLUMN IF EXISTS "senderId"
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      DROP COLUMN IF EXISTS "receiverId"
    `);

    // Adicionar foreign keys
    await queryRunner.query(`
      ALTER TABLE "chats" 
      ADD CONSTRAINT "FK_chats_user1" 
      FOREIGN KEY ("user1_id") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "chats" 
      ADD CONSTRAINT "FK_chats_user2" 
      FOREIGN KEY ("user2_id") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      ADD CONSTRAINT "FK_messages_chat" 
      FOREIGN KEY ("chat_id") REFERENCES "chats"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      ADD CONSTRAINT "FK_messages_sender" 
      FOREIGN KEY ("sender_id") REFERENCES "profiles"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter as mudanças
    await queryRunner.query(`
      ALTER TABLE "messages" 
      DROP CONSTRAINT "FK_messages_sender"
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      DROP CONSTRAINT "FK_messages_chat"
    `);

    await queryRunner.query(`
      ALTER TABLE "chats" 
      DROP CONSTRAINT "FK_chats_user2"
    `);

    await queryRunner.query(`
      ALTER TABLE "chats" 
      DROP CONSTRAINT "FK_chats_user1"
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      DROP COLUMN "sender_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      DROP COLUMN "chat_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "messages" 
      RENAME TO "message"
    `);

    await queryRunner.query(`DROP TABLE "chats"`);
  }
}
