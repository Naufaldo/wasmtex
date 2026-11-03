export interface ProjectTemplate {
  id: string
  title: string
  titleId: string
  titleEn: string
  descriptionId: string
  descriptionEn: string
  category: 'Presentation' | 'Journal' | 'Thesis' | 'Report'
  badge: string
  tags: string[]
  files: Record<string, string>
}

export const TEMPLATES: ProjectTemplate[] = [
  {
    id: 'tpl_beamer',
    title: 'Presentation Slide Deck (LaTeX Beamer)',
    titleId: 'Presentasi Ilmiah & Slide Konferensi (Beamer Deck)',
    titleEn: 'Academic Presentation Deck (LaTeX Beamer)',
    descriptionId: 'Slide presentasi modern aspect-ratio 16:9, outline agenda, blok persamaan matematika, dan layout multi-kolom.',
    descriptionEn: 'Modern 16:9 widescreen presentation slides with agenda outline, math theorem blocks, and 2-column layout.',
    category: 'Presentation',
    badge: 'SLIDES // 16:9',
    tags: ['Beamer', 'Presentation', 'Slides'],
    files: {
      'main.tex': `\\documentclass[aspectratio=169,11pt]{beamer}
\\usetheme{Madrid}
\\usecolortheme{beaver}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}

\\title[CorTeX Academic Suite]{High-Performance Academic Presentation}
\\subtitle{Scientific Research \\& WebAssembly LaTeX Intelligence}
\\author{Dr. Lead Researcher}
\\institute{CorTeX Research Institute}
\\date{\\today}

\\begin{document}

\\begin{frame}
  \\titlepage
\\end{frame}

\\begin{frame}{Outline Agenda}
  \\tableofcontents
\\end{frame}

\\section{Introduction \\& Scope}
\\begin{frame}{Background \\& Research Motivation}
  \\begin{itemize}
    \\item Rapid evolution of client-side browser compilation paradigms.
    \\item Elimination of network round-trip overhead and server queue delays.
    \\item Guaranteed privacy: sensitive manuscripts never leave local device memory.
  \\end{itemize}
  \\begin{block}{Core Objective}
    Achieve sub-second compilation latencies with 100\\% deterministic PDF output.
  \\end{block}
\\end{frame}

\\section{Mathematical Formulation}
\\begin{frame}{System Model \\& Optimization}
  \\begin{columns}
    \\begin{column}{0.48\\textwidth}
      \\textbf{Optimization Objective:}
      \\begin{equation}
        \\min_{\\theta} \\sum_{i=1}^{N} \\| \\hat{y}_i - y_i \\|^2 + \\lambda \\Omega(\\theta)
      \\end{equation}
      \\begin{itemize}
        \\item 64MB WASM Heap Buffer
        \\item AST Diff Engine: $< 142$ ms
      \\end{itemize}
    \\end{column}
    \\begin{column}{0.48\\textwidth}
      \\begin{exampleblock}{Performance Benchmark}
        \\begin{itemize}
          \\item Cold start compile: $\\sim 380$ ms
          \\item Incremental paint: $\\sim 95$ ms
          \\item Sync accuracy: $99.8\\%$
        \\end{itemize}
      \\end{exampleblock}
    \\end{column}
  \\end{columns}
\\end{frame}

\\section{Conclusion}
\\begin{frame}{Concluding Remarks \\& Future Directions}
  \\begin{itemize}
    \\item Sovereign document engineering completely decoupled from central cloud servers.
    \\item Built-in multi-tenant IAM isolation with independent project sandboxing.
  \\end{itemize}
  \\vspace{1.5em}
  \\centering
  \\textbf{\\Large Thank You!} \\\\
  \\vspace{0.5em}
  \\small Questions and discussion welcome.
\\end{frame}

\\end{document}`,
    },
  },
  {
    id: 'tpl_ieee',
    title: 'IEEE Transactions 2-Column Journal',
    titleId: 'Naskah Jurnal IEEE 2-Kolom (Transactions Standard)',
    titleEn: 'IEEE Transactions 2-Column Journal Manuscript',
    descriptionId: 'Format resmi IEEE 2-kolom dengan abstract, keywords, IEEE author affiliations, tabel benchmarking, dan sitasi BibTeX.',
    descriptionEn: 'Standard IEEE 2-column format featuring abstract, IEEE keywords, author affiliations, benchmark table, and BibTeX citations.',
    category: 'Journal',
    badge: 'IEEE // 2-COLUMN',
    tags: ['IEEE', 'Journal', '2-Column'],
    files: {
      'main.tex': `\\documentclass[10pt,journal,final]{article}
\\usepackage[margin=1.8cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{cite}
\\usepackage{graphicx}
\\usepackage{booktabs}
\\usepackage{multicol}

\\title{\\textbf{Scalable In-Browser LaTeX Compilation and Collaborative Architecture for Academic Research}}

\\author{Lead Researcher, \\textit{Senior Member, IEEE}, and Co-Author Two, \\textit{Member, IEEE} \\\\
CorTeX Institute of Scientific Publishing, Jakarta, Indonesia \\\\
\\texttt{\\{researcher, coauthor\\}@cortex.ai}}

\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
Scientific publishing workflows have historically relied either on heavyweight local distribution toolchains or centralized cloud compilers subject to network latency and privacy constraints. We propose an embeddable WebAssembly-native compilation architecture executing TeX Live binaries directly inside browser client execution sandboxes. The proposed framework demonstrates sub-second compilation latencies, bi-directional SyncTeX correlation, and isolated multi-tenant workspaces.
\\end{abstract}

\\noindent\\textbf{Index Terms}---WebAssembly, LaTeX compilation, SyncTeX, scientific publishing, distributed document processing.

\\setlength{\\columnsep}{18pt}
\\begin{multicols}{2}

\\section{Introduction}
Precise typography and rigorous mathematical formulation remain foundational to scientific communication. Traditional cloud-based compile cycles impose round-trip network latencies exceeding multiple seconds over public networks \\cite{vaswani2017attention}. In this paper, we demonstrate local client compilation operating within a 64MB memory boundary.

\\section{System Formulation}
Consider an input source document $\\mathcal{D} = \\{s_1, s_2, \\dots, s_M\\}$ transformed into a serialized output stream $\\mathcal{P}$. The energy minimization for incremental typesetting is governed by:
\\begin{equation}
\\mathcal{J}(\\mathcal{D}) = \\arg\\min_{\\Omega} \\left( \\|\\nabla \\mathcal{P}\\|^2 + \\alpha \\sum_{k=1}^{K} \\delta(s_k) \\right)
\\label{eq:formulation}
\\end{equation}

\\section{Experimental Evaluation}
Table~\\ref{tab:benchmarks} summarizes the benchmark comparisons between standard cloud platforms and our in-browser engine.

\\begin{table*}[t]
\\caption{Latency and Resource Comparison Across Environments}
\\label{tab:benchmarks}
\\centering
\\begin{tabular}{lccc}
\\toprule
\\textbf{Platform} & \\textbf{Cold Start (s)} & \\textbf{Sync Delay (ms)} & \\textbf{Privacy Model} \\\\
\\midrule
Cloud LaTeX & 3.84 & 1420 & Remote Server \\\\
Local TeX Live & 0.92 & 310 & Local Disk \\\\
\\textbf{CorTeX WASM} & \\textbf{0.38} & \\textbf{112} & \\textbf{In-Browser Sandbox} \\\\
\\bottomrule
\\end{tabular}
\\end{table*}

\\section{Conclusion}
We established a sovereign, zero-server document engineering model capable of high-velocity publication preparation without external cloud dependencies.

\\bibliographystyle{plain}
\\bibliography{refs}

\\end{multicols}
\\end{document}`,
      'refs.bib': `@article{vaswani2017attention,
  author = {Vaswani, Ashish and Shazeer, Noam and Parmar, Niki and Uszkoreit, Jakob},
  title = {Attention Is All You Need},
  journal = {Advances in Neural Information Processing Systems},
  volume = {30},
  year = {2017}
}`,
    },
  },
  {
    id: 'tpl_elsevier',
    title: 'Elsevier ScienceDirect Journal Template',
    titleId: 'Template Naskah Jurnal Standar Elsevier (ScienceDirect)',
    titleEn: 'Elsevier ScienceDirect Standard Journal Preprint',
    descriptionId: 'Struktur artikel ilmiah Elsevier: Abstrak terstruktur, Graphical Abstract note, pemodelan matematika, dan daftar pustaka lengkap.',
    descriptionEn: 'Elsevier preprint standard format: Structured abstract, author affiliations, mathematical modeling, and reference bibliography.',
    category: 'Journal',
    badge: 'ELSEVIER // ARTICLE',
    tags: ['Elsevier', 'ScienceDirect', 'Journal'],
    files: {
      'main.tex': `\\documentclass[preprint,12pt]{article}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{booktabs}
\\usepackage{hyperref}

\\title{\\textbf{Advanced Methodologies for Benchtop Direct Air Capture and Multi-Sensor Data Fusion}}

\\author{Lead Researcher$^a$, Senior Metrology Specialist$^b$ \\\\
\\small $^a$ Department of Chemical \\& Industrial Engineering, CorTeX Institute \\\\
\\small $^b$ Sensor Systems Metrology Group, Global Research Network}

\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
Direct Air Capture (DAC) and biochar adsorption screening necessitate rigorous differential metrology to mitigate transient environmental drift. This study establishes a dual NDIR spectroscopic framework integrated with multi-run Kalman filtering. Empirical validations demonstrate a 99.4\\% repeatability factor under fluctuating humidity and temperature conditions.
\\end{abstract}

\\noindent\\textbf{Keywords:} Direct air capture, Carbon dioxide adsorption, Differential sensor metrology, Data fusion.

\\section{Introduction}
Quantitative carbon dioxide sequestration modeling requires continuous baseline stability. Traditional single-channel measurement platforms suffer from thermomechanical drift over extended adsorption screening epochs.

\\section{Material and Experimental Setup}
The experimental assembly consists of a benchtop adsorption column packed with engineered biochar sorbent substrates. Mass balance monitoring is achieved with dual load cells operating synchronously with NDIR spectroscopy.

\\begin{equation}
q_t = \\frac{(C_0 - C_t) \\cdot V_{\\text{gas}}}{m_{\\text{sorbent}}}
\\label{eq:adsorption}
\\end{equation}
where $q_t$ denotes the instantaneous adsorption capacity in $\\mathrm{mg/g}$.

\\section{Results and Discussion}
Adsorption isotherms followed the Langmuir model with an $R^2 > 0.992$, corroborating monolayer chemisorption mechanisms on activated surface functional sites.

\\section{Conclusion}
The proposed methodology offers a robust diagnostic screening framework for emerging negative emission technologies.

\\bibliographystyle{plain}
\\bibliography{refs}

\\end{document}`,
      'refs.bib': `@article{he2016deep,
  author = {He, Kaiming and Zhang, Xiangyu and Ren, Shaoqing and Sun, Jian},
  title = {Deep Residual Learning for Image Recognition},
  journal = {Proceedings of the IEEE Conference on Computer Vision and Pattern Recognition},
  year = {2016}
}`,
    },
  },
  {
    id: 'tpl_thesis',
    title: 'Academic Thesis & Dissertation (Multi-Chapter)',
    titleId: 'Format Tesis / Skripsi / Disertasi Lengkap (Multi-Bab)',
    titleEn: 'Comprehensive Academic Thesis & Dissertation Format',
    descriptionId: 'Template buku tesis akademik standar dengan halaman judul resmi, daftar isi otomatis, bab pendahuluan, metodologi, dan hasil.',
    descriptionEn: 'Academic thesis & dissertation layout with official title page, automated Table of Contents, and modular chapter structure.',
    category: 'Thesis',
    badge: 'THESIS // A4 REPORT',
    tags: ['Thesis', 'Report', 'Dissertation'],
    files: {
      'main.tex': `\\documentclass[12pt,a4paper,oneside]{report}
\\usepackage[margin=3cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{graphicx}
\\usepackage{hyperref}

\\begin{document}

\\begin{titlepage}
  \\centering
  \\vspace*{2cm}
  {\\LARGE \\textbf{DESIGN AND IMPLEMENTATION OF NEXT-GENERATION IN-BROWSER SCIENTIFIC WORKSPACES}\\par}
  \\vspace{1.5cm}
  {\\large Disertasi / Tesis Akademik\\par}
  \\vspace{2cm}
  {\\large Disusun Oleh:\\par}
  \\textbf{\\Large Candidate Scholar}\\par
  \\vspace{0.5cm}
  ID / NIM: 2026-CS-9912\\par
  \\vfill
  Fakultas Teknik \\& Ilmu Komputer\\\\
  CorTeX Institute of Technology\\\\
  \\today
\\end{titlepage}

\\pagenumbering{roman}
\\tableofcontents
\\newpage

\\chapter*{Ringkasan Eksekutif}
Penelitian ini menginvestigasi arsitektur komputasi mutakhir berbasis WebAssembly untuk aplikasi teknik industri dan penulisan ilmiah real-time tanpa server...
\\newpage

\\pagenumbering{arabic}
\\chapter{Pendahuluan}
\\section{Latar Belakang}
Perkembangan sistem komputasi terdistribusi menuntut kecepatan dan keamanan data tinggi tanpa ketergantungan pada server pihak ketiga.

\\section{Rumusan Masalah}
Bagaimana merancang arsitektur compiler di peramban yang mampu memproses dokumen kompleks dengan latensi sub-detik?

\\chapter{Tinjauan Pustaka}
\\section{WebAssembly dan Kompilasi Native}
WebAssembly (WASM) menyediakan sandbox biner portabel berkecepatan tinggi mendekati performa native C/C++ pada browser modern.

\\chapter{Metodologi Penelitian}
\\section{Perancangan Arsitektur}
Model sistem mengintegrasikan memori heap 64MB dengan isolasi peran berbasis Identity and Access Management (IAM).

\\chapter{Hasil dan Pembahasan}
\\section{Pengujian Performa}
Hasil pengujian menunjukkan efisiensi pemrosesan hingga 84\\% lebih cepat dibandingkan compiler cloud konvensional.

\\chapter{Kesimpulan dan Saran}
\\section{Kesimpulan}
Arsitektur yang diusulkan terbukti stabil, handal, dan sepenuhnya terisolasi antar-pengguna pada IndexedDB.

\\bibliographystyle{plain}
\\bibliography{refs}

\\end{document}`,
      'refs.bib': `@article{smith2024embedded,
  author = {Smith, John and Doe, Jane},
  title = {Next-Generation Embedded Architectures},
  journal = {Journal of Systems Architecture},
  year = {2024}
}`,
    },
  },
  {
    id: 'tpl_nature',
    title: 'Nature & Springer High-Impact Paper',
    titleId: 'Template Naskah Saintifik Nature / Springer',
    titleEn: 'Nature & Springer High-Impact Scientific Paper',
    descriptionId: 'Format artikel saintifik prestisius kolom tunggal dengan abstrak tebal, metodologi presisi, dan tipografi elegan.',
    descriptionEn: 'Single-column high-impact scientific manuscript format with bold executive abstract and elegant typography.',
    category: 'Journal',
    badge: 'NATURE // SPRINGER',
    tags: ['Nature', 'Springer', 'High-Impact'],
    files: {
      'main.tex': `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=2.2cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{cite}
\\usepackage{hyperref}

\\title{\\textbf{Sub-second client-side typesetting and deterministic AST synchronization in browser runtimes}}
\\author{Dr. Aris Thorne$^{1,*}$, Prof. Elena Rostova$^2$ \\\\
\\small $^1$ Quantum Computing \\& Document Engineering Division, CorTeX Lab \\\\
\\small $^2$ Department of Computer Science, Institute of Applied Technology \\\\
\\small $^*$Corresponding author: athorne@cortex.ai}

\\date{\\today}

\\begin{document}
\\maketitle

\\begin{abstract}
\\textbf{Here we demonstrate that complete LaTeX typesetting ecosystems can be isolated and executed in memory-bounded client WebAssembly sandboxes without losing typesetting fidelity. Our benchmarks demonstrate a 10-fold reduction in compilation turnaround while preserving 100\\% byte-level deterministic PDF reproducibility across heterogeneous browser environments.}
\\end{abstract}

\\section*{Introduction}
The reproducibility crisis in computational sciences extends to document preparation pipelines. Document compilers historically depend on host-specific font configurations and dynamic library paths.

\\section*{Results}
Across a benchmark corpus of 1,200 peer-reviewed papers containing heavy mathematical formulations, average compile duration clocked at 182 ms on standard quad-core client hardware.

\\section*{Methods}
The virtual file system executes inside memory-mapped buffers with SyncTeX forward and backward correlation primitives.

\\bibliographystyle{unsrt}
\\bibliography{refs}

\\end{document}`,
      'refs.bib': `@article{thorne2026nature,
  author = {Thorne, Aris and Rostova, Elena},
  title = {Deterministic Document Engineering},
  journal = {Nature Computational Science},
  year = {2026}
}`,
    },
  },
  {
    id: 'tpl_report',
    title: 'Engineering Technical Report & Lab Monograph',
    titleId: 'Laporan Teknis Proyek & Eksperimen Laboratorium',
    titleEn: 'Engineering Technical Report & Lab Monograph',
    descriptionId: 'Format laporan teknis industri profesional dengan running header, nomor laporan, spesifikasi instrumentasi, dan ringkasan eksekutif.',
    descriptionEn: 'Professional engineering project report format with running header, equipment specs, and executive summary.',
    category: 'Report',
    badge: 'TECHNICAL // REPORT',
    tags: ['Report', 'Technical', 'Engineering'],
    files: {
      'main.tex': `\\documentclass[11pt,a4paper]{article}
\\usepackage[margin=2.5cm]{geometry}
\\usepackage{amsmath,amssymb}
\\usepackage{booktabs}
\\usepackage{fancyhdr}
\\pagestyle{fancy}
\\fancyhf{}
\\rhead{CorTeX Technical Report \\#TR-2026-04}
\\lhead{Industrial Automation \\& Telemetry Station}
\\rfoot{Page \\thepage}

\\title{\\textbf{TECHNICAL REPORT: AUTOMATED PUMP TEST BED V3 AND SENSOR TELEMETRY CALIBRATION}}
\\author{Industrial Automation \\& Controls Group \\\\ Lead Controls Engineer}
\\date{\\today}

\\begin{document}
\\maketitle
\\thispagestyle{fancy}

\\section{Executive Summary}
This document outlines the testing, wiring validation, and Modbus RTU telemetry synchronization for the dual pump testing station (45kW 380V line and 160kW 1000V line) operated via Yaskawa GA700 VFD and Weidmuller UC20-M3000 controller.

\\section{System Specifications}
\\begin{itemize}
  \\item \\textbf{Line 1 (4-inch pipe):} TB1 45kW 380V pump, Wingel PCM2052-GP pressure transmitter.
  \\item \\textbf{Line 2 (8-inch pipe):} TB2 160kW 1000V pump, MicroSensor MPM486 pressure transmitter.
  \\item \\textbf{Telemetry Bus:} RS485 Modbus RTU, 19200 baud, 8-E-1.
\\end{itemize}

\\section{Safety Interlocks (STO \\& Emergency Stop)}
All emergency stop circuits are hardwired directly into the VFD STO (Safe Torque Off) terminals and verified compliant with SIL3 / Ple safety interlock standards.

\\section{Conclusion \\& Commissioning Checklist}
The system is cleared for operational baseline validation testing up to 60Hz variable frequency curves.

\\end{document}`,
    },
  },
]
