-- CreateTable
CREATE TABLE "bumdes" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "desa" TEXT NOT NULL,
    "kecamatan" TEXT NOT NULL,

    CONSTRAINT "bumdes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "bumdes_id" INTEGER,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_kategori" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "master_kategori_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_pekerjaan" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "kategori_id" INTEGER NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "satuan" TEXT NOT NULL,

    CONSTRAINT "master_pekerjaan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_sumber_daya" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "tipe" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "satuan" TEXT NOT NULL,

    CONSTRAINT "master_sumber_daya_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "master_koefisien" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "pekerjaan_id" INTEGER NOT NULL,
    "sumber_daya_id" INTEGER NOT NULL,
    "koefisien" DECIMAL(10,4) NOT NULL,

    CONSTRAINT "master_koefisien_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "harga_lokal" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "bumdes_id" INTEGER NOT NULL,
    "sumber_daya_id" INTEGER NOT NULL,
    "tahun" INTEGER NOT NULL,
    "harga" DECIMAL(18,2) NOT NULL,

    CONSTRAINT "harga_lokal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rab_proyek" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "bumdes_id" INTEGER NOT NULL,
    "nomor_dokumen" TEXT NOT NULL,
    "nama_proyek" TEXT NOT NULL,
    "tahun" INTEGER NOT NULL,
    "overhead_persen" DECIMAL(5,2) NOT NULL DEFAULT 10,
    "ppn_persen" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'draft',

    CONSTRAINT "rab_proyek_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rab_bab" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "rab_id" INTEGER NOT NULL,
    "kode" TEXT NOT NULL,
    "nama_bab" TEXT NOT NULL,

    CONSTRAINT "rab_bab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rab_item" (
    "id" SERIAL NOT NULL,
    "uuid" TEXT NOT NULL,
    "bab_id" INTEGER NOT NULL,
    "pekerjaan_id" INTEGER NOT NULL,
    "volume" DECIMAL(14,4) NOT NULL,
    "harga_satuan_terkunci" DECIMAL(18,2),
    "total_harga_terkunci" DECIMAL(18,2),

    CONSTRAINT "rab_item_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "bumdes_uuid_key" ON "bumdes"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "bumdes_kode_key" ON "bumdes"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "users_uuid_key" ON "users"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "master_kategori_uuid_key" ON "master_kategori"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "master_kategori_kode_key" ON "master_kategori"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "master_pekerjaan_uuid_key" ON "master_pekerjaan"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "master_pekerjaan_kode_key" ON "master_pekerjaan"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "master_sumber_daya_uuid_key" ON "master_sumber_daya"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "master_sumber_daya_kode_key" ON "master_sumber_daya"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "master_koefisien_uuid_key" ON "master_koefisien"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "harga_lokal_uuid_key" ON "harga_lokal"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "harga_lokal_bumdes_id_sumber_daya_id_tahun_key" ON "harga_lokal"("bumdes_id", "sumber_daya_id", "tahun");

-- CreateIndex
CREATE UNIQUE INDEX "rab_proyek_uuid_key" ON "rab_proyek"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "rab_proyek_nomor_dokumen_key" ON "rab_proyek"("nomor_dokumen");

-- CreateIndex
CREATE UNIQUE INDEX "rab_bab_uuid_key" ON "rab_bab"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "rab_item_uuid_key" ON "rab_item"("uuid");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_bumdes_id_fkey" FOREIGN KEY ("bumdes_id") REFERENCES "bumdes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_pekerjaan" ADD CONSTRAINT "master_pekerjaan_kategori_id_fkey" FOREIGN KEY ("kategori_id") REFERENCES "master_kategori"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_koefisien" ADD CONSTRAINT "master_koefisien_pekerjaan_id_fkey" FOREIGN KEY ("pekerjaan_id") REFERENCES "master_pekerjaan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "master_koefisien" ADD CONSTRAINT "master_koefisien_sumber_daya_id_fkey" FOREIGN KEY ("sumber_daya_id") REFERENCES "master_sumber_daya"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harga_lokal" ADD CONSTRAINT "harga_lokal_bumdes_id_fkey" FOREIGN KEY ("bumdes_id") REFERENCES "bumdes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "harga_lokal" ADD CONSTRAINT "harga_lokal_sumber_daya_id_fkey" FOREIGN KEY ("sumber_daya_id") REFERENCES "master_sumber_daya"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rab_proyek" ADD CONSTRAINT "rab_proyek_bumdes_id_fkey" FOREIGN KEY ("bumdes_id") REFERENCES "bumdes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rab_bab" ADD CONSTRAINT "rab_bab_rab_id_fkey" FOREIGN KEY ("rab_id") REFERENCES "rab_proyek"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rab_item" ADD CONSTRAINT "rab_item_bab_id_fkey" FOREIGN KEY ("bab_id") REFERENCES "rab_bab"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rab_item" ADD CONSTRAINT "rab_item_pekerjaan_id_fkey" FOREIGN KEY ("pekerjaan_id") REFERENCES "master_pekerjaan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
