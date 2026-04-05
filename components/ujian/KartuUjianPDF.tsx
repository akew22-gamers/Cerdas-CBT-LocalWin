'use client'

import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from '@react-pdf/renderer'
import { KartuUjianData } from '@/types/kartu'

const PAGE_WIDTH = 595.28
const PAGE_HEIGHT = 841.89

const MARGIN_TOP = 15
const MARGIN_BOTTOM = 15
const MARGIN_LEFT = 15
const MARGIN_RIGHT = 15

const COLS = 2
const ROWS = 5
const CARDS_PER_PAGE = COLS * ROWS

const availableWidth = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT
const availableHeight = PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM

const GAP = 5
const CARD_WIDTH = (availableWidth - GAP * (COLS - 1)) / COLS
const CARD_HEIGHT = (availableHeight - GAP * (ROWS - 1)) / ROWS

const styles = StyleSheet.create({
  page: {
    paddingTop: MARGIN_TOP,
    paddingBottom: MARGIN_BOTTOM,
    paddingLeft: MARGIN_LEFT,
    paddingRight: MARGIN_RIGHT,
    fontFamily: 'Helvetica',
  },
  row: {
    flexDirection: 'row',
    marginBottom: GAP,
  },
  lastRow: {
    flexDirection: 'row',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderWidth: 1.5,
    borderColor: '#000000',
    borderStyle: 'solid',
    padding: 6,
    marginRight: GAP,
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
  },
  lastCard: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderWidth: 1.5,
    borderColor: '#000000',
    borderStyle: 'solid',
    padding: 6,
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
  },
  
  headerSection: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    paddingBottom: 4,
    marginBottom: 4,
  },
  logoContainer: {
    width: 35,
    height: 35,
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 28,
    height: 28,
    objectFit: 'contain',
  },
  logoPlaceholder: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  headerLine1: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  headerLine2: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  
  titleSection: {
    borderBottomWidth: 1.5,
    borderBottomColor: '#000000',
    paddingVertical: 3,
    marginBottom: 4,
  },
  titleText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
    textTransform: 'uppercase',
  },
  
  contentSection: {
    flexDirection: 'row',
    flex: 1,
  },
  leftSection: {
    flex: 1,
    paddingRight: 4,
  },
  rightSection: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 4,
    borderLeftWidth: 0.5,
    borderLeftColor: '#999999',
  },
  
  sectionTitle: {
    fontSize: 7,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  
  infoRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  infoLabel: {
    fontSize: 5.5,
    fontWeight: 'normal',
    color: '#000000',
    width: 20,
  },
  infoColon: {
    fontSize: 5.5,
    color: '#000000',
    width: 5,
  },
  infoValue: {
    fontSize: 5.5,
    color: '#000000',
    flex: 1,
  },
  
  divider: {
    borderTopWidth: 0.5,
    borderTopColor: '#666666',
    marginVertical: 3,
  },
  
  qrImage: {
    width: 52,
    height: 52,
  },
  qrPlaceholder: {
    width: 52,
    height: 52,
    backgroundColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#999999',
  },
  qrLabel: {
    fontSize: 5,
    textAlign: 'center',
    color: '#000000',
    marginTop: 2,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  
  emptyPage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#999999',
  },
})

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size))
  }
  return chunks
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength - 2) + '..'
}

function ExamCard({
  data,
  isLastCard,
}: {
  data: KartuUjianData
  isLastCard: boolean
}) {
  const { siswa, ujian, sekolah, qrData } = data

  return (
    <View style={isLastCard ? styles.lastCard : styles.card}>
      <View style={styles.headerSection}>
        <View style={styles.logoContainer}>
          {sekolah.logo_url ? (
            <Image src={sekolah.logo_url} style={styles.logo} />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Text style={{ fontSize: 5, color: '#666' }}>LOGO</Text>
            </View>
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.headerLine1}>KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH</Text>
          <Text style={styles.headerLine2}>{truncateText(sekolah.nama_sekolah.toUpperCase(), 35)}</Text>
        </View>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.titleText}>KARTU PESERTA UJIAN</Text>
      </View>

      <View style={styles.contentSection}>
        <View style={styles.leftSection}>
          <View style={{ marginBottom: 3 }}>
            <Text style={styles.sectionTitle}>DATA PESERTA</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Nama</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{truncateText(siswa.nama.toUpperCase(), 25)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>NISN</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{siswa.nisn}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kelas</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{(siswa.kelas?.nama_kelas || '-').toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={{ marginTop: 2 }}>
            <Text style={styles.sectionTitle}>INFORMASI UJIAN</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ujian</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{truncateText(ujian.judul.toUpperCase(), 28)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Kode</Text>
              <Text style={styles.infoColon}>:</Text>
              <Text style={styles.infoValue}>{ujian.kode_ujian}</Text>
            </View>
          </View>
        </View>

        <View style={styles.rightSection}>
          {qrData && qrData.startsWith('data:image') ? (
            <Image src={qrData} style={styles.qrImage} />
          ) : (
            <View style={styles.qrPlaceholder}>
              <Text style={{ fontSize: 6, color: '#999' }}>QR</Text>
            </View>
          )}
          <Text style={styles.qrLabel}>SCAN TO LOGIN</Text>
        </View>
      </View>
    </View>
  )
}

export function KartuUjianPDF({ data }: { data: KartuUjianData[] }) {
  if (!data || data.length === 0) {
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          <View style={styles.emptyPage}>
            <Text style={styles.emptyText}>Tidak ada data kartu ujian</Text>
          </View>
        </Page>
      </Document>
    )
  }

  const pages = chunkArray(data, CARDS_PER_PAGE)

  return (
    <Document
      title="Kartu Ujian"
      author="Cerdas-CBT"
      subject="Kartu Ujian Siswa"
      creator="Cerdas-CBT by EAS Creative Studio"
    >
      {pages.map((pageCards, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          {Array.from({ length: ROWS }).map((_, rowIndex) => {
            const startIdx = rowIndex * COLS
            const rowCards = pageCards.slice(startIdx, startIdx + COLS)

            if (rowCards.length === 0) return null

            const isLastRow = rowIndex === ROWS - 1

            return (
              <View key={rowIndex} style={isLastRow ? styles.lastRow : styles.row}>
                {rowCards.map((cardData, colIndex) => (
                  <ExamCard
                    key={startIdx + colIndex}
                    data={cardData}
                    isLastCard={colIndex === rowCards.length - 1}
                  />
                ))}
              </View>
            )
          })}
        </Page>
      ))}
    </Document>
  )
}

export default KartuUjianPDF