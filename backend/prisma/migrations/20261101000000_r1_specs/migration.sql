-- AlterTable
ALTER TABLE "master_kategori" ADD COLUMN "pembulatan" TEXT NOT NULL DEFAULT 'down_0';

-- AlterTable
ALTER TABLE "master_koefisien" ALTER COLUMN "sumber_daya_id" DROP NOT NULL;
ALTER TABLE "master_koefisien" ADD COLUMN "sub_pekerjaan_id" INTEGER;
ALTER TABLE "master_koefisien" ADD COLUMN "basis_harga" TEXT NOT NULL DEFAULT 'final';

-- AlterTable
ALTER TABLE "rab_item" ALTER COLUMN "harga_satuan_terkunci" SET DATA TYPE DECIMAL(24,6);
ALTER TABLE "rab_item" ALTER COLUMN "total_harga_terkunci" SET DATA TYPE DECIMAL(24,6);

-- AddForeignKey
ALTER TABLE "master_koefisien" ADD CONSTRAINT "master_koefisien_sub_pekerjaan_id_fkey" FOREIGN KEY ("sub_pekerjaan_id") REFERENCES "master_pekerjaan"("id") ON DELETE SET NULL ON UPDATE CASCADE;
