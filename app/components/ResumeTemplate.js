import React from 'react';
import { Page, Text, View, Document, StyleSheet, Link } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: '30 40',
    fontFamily: 'Times-Roman',
    fontSize: 10,
    color: '#000',
    lineHeight: 1.3,
  },
  header: {
    marginBottom: 10,
    textAlign: 'center',
  },
  name: {
    fontSize: 16,
    fontFamily: 'Times-Roman',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    fontSize: 9,
  },
  link: {
    color: '#0000EE',
    textDecoration: 'underline',
  },
  section: {
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Times-Bold',
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    paddingBottom: 2,
    marginBottom: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  bold: {
    fontFamily: 'Times-Bold',
  },
  italic: {
    fontFamily: 'Times-Italic',
  },
  entryHeader: {
    marginBottom: 2,
  },
  bulletRow: {
    flexDirection: 'row',
    marginBottom: 2,
    paddingLeft: 10,
    paddingRight: 10,
  },
  bullet: {
    width: 10,
    fontSize: 10,
  },
  bulletText: {
    flex: 1,
  },
  textRight: {
    textAlign: 'right',
  }
});

const BulletList = ({ items }) => {
  if (!items || items.length === 0) return null;
  const list = Array.isArray(items) ? items : items.split('\n').filter(Boolean);
  return list.map((item, idx) => (
    <View key={idx} style={styles.bulletRow}>
      <Text style={styles.bullet}>•</Text>
      <Text style={styles.bulletText}>{item.replace(/^[-•]\s*/, '')}</Text>
    </View>
  ));
};

const HorizontalList = ({ items }) => {
  if (!items || items.length === 0) return null;
  const list = Array.isArray(items) ? items : items.split('\n').filter(Boolean);
  return (
    <Text style={{ lineHeight: 1.1 }}>
      {list.map((item, idx) => (
        <Text key={idx}>• {item.replace(/^[-•]\s*/, '')}{idx < list.length - 1 ? '    ' : ''}</Text>
      ))}
    </Text>
  );
};

export const ResumeTemplate = ({ data }) => {
  if (!data) return null;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={styles.name}>{data.personalInfo?.name || 'YOUR NAME'}</Text>
          <View style={styles.contactRow}>
            {data.personalInfo?.email && <Link src={`mailto:${data.personalInfo.email}`} style={styles.link}>{data.personalInfo.email}</Link>}
            {data.personalInfo?.phone && <Text> | {data.personalInfo.phone}</Text>}
            {data.personalInfo?.linkedin && <Text> | </Text>}
            {data.personalInfo?.linkedin && <Link src={data.personalInfo.linkedin} style={styles.link}>{data.personalInfo.linkedin}</Link>}
          </View>
        </View>

        {/* EDUCATION */}
        {data.education && data.education.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EDUCATION</Text>
            {data.education.map((edu, idx) => (
              <View key={idx} style={{ marginBottom: 4 }}>
                <View style={styles.row}>
                  <Text style={styles.bold}>{edu.school}</Text>
                  <Text>{edu.date}</Text>
                </View>
                <View style={styles.row}>
                  <Text style={styles.italic}>{edu.degree}</Text>
                  <Text style={styles.italic}>{edu.location}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* EXPERIENCE */}
        {data.experience && data.experience.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXPERIENCE</Text>
            {data.experience.map((exp, idx) => (
              <View key={idx} style={{ marginBottom: 6 }}>
                <View style={styles.row}>
                  <Text><Text style={styles.bold}>{exp.title}</Text>{exp.company ? ` | ${exp.company}` : ''}</Text>
                  <Text>{exp.date}</Text>
                </View>
                <BulletList items={exp.description} />
              </View>
            ))}
          </View>
        )}

        {/* PROJECTS */}
        {data.projects && data.projects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>PROJECTS</Text>
            {data.projects.map((proj, idx) => (
              <View key={idx} style={{ marginBottom: 6 }}>
                <View style={styles.row}>
                  <Text style={styles.bold}>{proj.name}</Text>
                  <Text>{proj.date}</Text>
                </View>
                <BulletList items={proj.description} />
              </View>
            ))}
          </View>
        )}

        {/* SKILLS */}
        {data.skills && data.skills.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SKILLS</Text>
            <HorizontalList items={data.skills} />
          </View>
        )}

        {/* EXTRACURRICULAR */}
        {data.extracurricular && data.extracurricular.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>EXTRACURRICULAR ACHIEVEMENTS AND ACTIVITIES</Text>
            <BulletList items={data.extracurricular} />
          </View>
        )}

        {/* CERTIFICATES */}
        {data.certificates && data.certificates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CERTIFICATES</Text>
            <HorizontalList items={data.certificates} />
          </View>
        )}
      </Page>
    </Document>
  );
};
