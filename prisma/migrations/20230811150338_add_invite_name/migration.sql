/*
  Warnings:

  - Added the required column `name` to the `GroupInvite` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "GroupInvite" ADD COLUMN     "name" TEXT NOT NULL;
