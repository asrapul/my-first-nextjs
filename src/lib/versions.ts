import { supabase } from './supabase/client'

export interface DocumentVersion {
  id: string
  document_id: string
  content: string
  version_number: number
  label: string | null
  created_by: string | null
  created_at: string
}

// Tipe ringkas untuk daftar timeline (tanpa content penuh — hemat bandwidth)
export type DocumentVersionSummary = Omit<DocumentVersion, 'content'>

// ─── Simpan snapshot ────────────────────────────────────────────────────────

export async function createSnapshot(
  documentId: string,
  content: string,
  createdBy: string,
  label?: string
): Promise<DocumentVersion | null> {
  // Cek apakah perlu snapshot baru
  const { data: lastVersion } = await supabase
    .from('document_versions')
    .select('content, version_number')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Konten sama? Skip
  if (lastVersion && lastVersion.content === content) return null

  const nextVersion = (lastVersion?.version_number ?? 0) + 1

  const { data, error } = await supabase
    .from('document_versions')
    .insert({
      document_id: documentId,
      content,
      version_number: nextVersion,
      label: label ?? null,
      created_by: createdBy,
    })
    .select()
    .single()

  if (error) {
    // Duplicate key = race condition antara 2 tab — bukan error fatal
    if (error.code === '23505') {
      console.warn('createSnapshot: duplicate version_number (race condition), skipping')
      return null
    }
    console.error('createSnapshot error:', error.message, error.code, error.details)
    throw new Error(`Gagal menyimpan versi: ${error.message}`)
  }

  return data
}

// ─── Ambil daftar versi (tanpa content) untuk timeline ─────────────────────

export async function getVersionList(
  documentId: string,
  page: number = 0,
  pageSize: number = 20
): Promise<{ versions: DocumentVersionSummary[]; hasMore: boolean }> {
  // Supabase .range(a, b) inklusif di kedua ujung → ambil pageSize + 1 row
  const from = page * pageSize
  const to = from + pageSize // inklusif → total = pageSize + 1 row

  const { data, error } = await supabase
    .from('document_versions')
    .select('id, document_id, version_number, label, created_by, created_at')
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .range(from, to)

  if (error) throw new Error('Gagal mengambil histori versi')

  const hasMore = data.length > pageSize
  return {
    versions: data.slice(0, pageSize),
    hasMore,
  }
}

// ─── Ambil konten satu versi (untuk diff dan restore) ──────────────────────

export async function getVersionContent(versionId: string): Promise<DocumentVersion> {
  const { data, error } = await supabase
    .from('document_versions')
    .select('*')
    .eq('id', versionId)
    .single()

  if (error) throw new Error('Versi tidak ditemukan')
  return data
}

// ─── Restore: copy content versi lama ke dokumen aktif ─────────────────────

export async function restoreVersion(
  documentId: string,
  versionId: string,
  userId: string
): Promise<string> {
  // Ambil konten versi yang mau di-restore
  const version = await getVersionContent(versionId)

  // Update dokumen aktif
  const { error: updateError } = await supabase
    .from('documents')
    .update({
      content: version.content,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId)

  if (updateError) throw new Error('Gagal restore dokumen')

  // Simpan snapshot baru bertanda "Restored from vX"
  await createSnapshot(
    documentId,
    version.content,
    userId,
    `Restored from v${version.version_number}`
  )

  return version.content
}
