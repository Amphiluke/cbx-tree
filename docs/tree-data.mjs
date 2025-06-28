export const treeData = [
  {
    title: 'project-alpha',
    children: [
      {
        title: 'data',
        children: [
          {
            title: 'analytics',
            children: [
              {title: 'monthly_report.pdf'},
              {title: 'yearly_summary.pdf'},
            ],
          },
          {
            title: 'processed',
            children: [
              {title: 'customers_clean.csv'},
              {title: 'sales_clean.csv'},
            ],
          },
          {
            title: 'raw',
            children: [
              {title: 'customers.csv'},
              {title: 'sales.csv'},
            ],
          },
        ],
      },
      {
        title: 'docs',
        children: [
          {
            title: 'api',
            children: [
              {title: 'auth.md'},
              {title: 'data.md'},
              {title: 'errors.md'},
            ],
          },
          {title: 'installation.md'},
          {title: 'overview.md'},
        ],
      },
      {
        title: 'scripts',
        children: [
          {title: 'build.sh'},
          {title: 'deploy.sh'},
          {title: 'cleanup.sh'},
        ],
      },
      {
        title: 'src',
        children: [
          {
            title: 'components',
            children: [
              {
                title: 'utils',
                children: [
                  {title: 'formatter.py'},
                  {title: 'parser.py'},
                ],
              },
              {title: '__init__.py'},
              {title: 'auth.py'},
              {title: 'database.py'},
            ],
          },
          {
            title: 'config',
            children: [
              {title: 'dev.yaml'},
              {title: 'prod.yaml'},
            ],
          },
          {
            title: 'tests',
            children: [
              {title: 'test_app.py'},
              {title: 'test_auth.py'},
              {title: 'test_database.py'},
            ],
          },
          {title: 'app.py'},
        ],
      },
      {title: 'LICENSE'},
      {title: 'README.md'},
    ],
  },
  {
    title: 'project-beta',
    children: [
      {
        title: 'docs',
        children: [
          {title: 'api_reference.md'},
          {title: 'architecture.md'},
          {title: 'intro.md'},
        ],
      },
      {
        title: 'source',
        children: [
          {
            title: 'include',
            children: [
              {
                title: 'network',
                children: [
                  {title: 'protocol.h'},
                  {title: 'socket.h'},
                ],
              },
              {title: 'main.h'},
              {title: 'utils.h'},
            ],
          },
          {
            title: 'lib',
            children: [
              {title: 'helpers.cpp'},
              {title: 'logger.cpp'},
              {title: 'network.cpp'},
            ],
          },
          {title: 'main.cpp'},
        ],
      },
      {
        title: 'tests',
        children: [
          {title: 'test_logger.cpp'},
          {title: 'test_main.cpp'},
          {title: 'test_network.cpp'},
        ],
      },
      {
        title: 'tools',
        children: [
          {title: 'analyze.py'},
          {title: 'build_tool.sh'},
        ],
      },
      {title: 'README.md'},
    ],
  },
  {
    title: 'project-gamma',
    children: [
      {
        title: 'app',
        children: [
          {
            title: 'components',
            children: [
              {title: 'footer.js'},
              {title: 'header.js'},
              {title: 'sidebar.js'},
            ],
          },
          {
            title: 'styles',
            children: [
              {title: 'main.css'},
              {title: 'theme.css'},
            ],
          },
          {
            title: 'utils',
            children: [
              {title: 'helpers.js'},
              {title: 'validators.js'},
            ],
          },
          {title: 'index.js'},
        ],
      },
      {
        title: 'docs',
        children: [
          {title: 'changelog.md'},
          {title: 'faq.md'},
          {title: 'user_guide.md'},
        ],
      },
      {
        title: 'public',
        children: [
          {
            title: 'images',
            children: [
              {
                title: 'icons',
                children: [
                  {title: 'search.svg'},
                  {title: 'user.svg'},
                ],
              },
              {title: 'banner.jpg'},
              {title: 'logo.png'},
            ],
          },
          {title: 'index.html'},
        ],
      },
      {
        title: 'tests',
        children: [
          {
            title: 'integration',
            children: [
              {title: 'test_app.js'},
              {title: 'test_components.js'},
            ],
          },
          {
            title: 'unit',
            children: [
              {title: 'test_helpers.js'},
              {title: 'test_validators.js'},
            ],
          },
        ],
      },
      {title: 'README.md'},
    ],
  },
  {
    title: 'tools',
    children: [
      {
        title: 'backup',
        children: [
          {title: 'backup.sh'},
          {title: 'config.json'},
          {title: 'restore.sh'},
        ],
      },
      {
        title: 'maintenance',
        children: [
          {
            title: 'logs',
            children: [
              {title: 'app.log'},
              {title: 'error.log'},
            ],
          },
          {title: 'clean_temp.sh'},
          {title: 'optimize_db.sh'},
        ],
      },
      {
        title: 'monitoring',
        children: [
          {title: 'alerts.py'},
          {title: 'monitor.py'},
          {title: 'README.md'},
        ],
      },
    ],
  },
  {
    title: 'users',
    children: [
      {
        title: 'alice',
        children: [
          {
            title: 'documents',
            children: [
              {title: 'notes.txt'},
              {title: 'project_proposal.pdf'},
              {title: 'resume.docx'},
            ],
          },
          {
            title: 'music',
            children: [
              {
                title: 'favorites',
                children: [
                  {title: 'song1.mp3'},
                  {title: 'song2.mp3'},
                ],
              },
              {title: 'playlist.m3u'},
            ],
          },
          {
            title: 'pictures',
            children: [
              {
                title: 'vacation',
                children: [
                  {title: 'beach.jpg'},
                  {title: 'mountains.png'},
                ],
              },
              {title: 'profile.png'},
            ],
          },
        ],
      },
      {
        title: 'bob',
        children: [
          {
            title: 'documents',
            children: [
              {title: 'budget.xlsx'},
              {title: 'report.docx'},
              {title: 'todo.txt'},
            ],
          },
          {
            title: 'downloads',
            children: [
              {title: 'ebook.pdf'},
              {title: 'software.zip'},
            ],
          },
          {
            title: 'pictures',
            children: [
              {title: 'family.jpg'},
              {title: 'pet.png'},
            ],
          },
        ],
      },
    ],
  },
];
