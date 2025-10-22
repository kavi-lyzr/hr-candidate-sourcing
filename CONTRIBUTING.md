# Contributing to Lyzr HR Candidate Sourcing Agent

Thank you for your interest in contributing! We appreciate your time and effort in helping improve this project.

## How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:

1. **Clear title** - Describe the issue concisely
2. **Steps to reproduce** - Detailed steps to replicate the bug
3. **Expected behavior** - What you expected to happen
4. **Actual behavior** - What actually happened
5. **Environment details** - OS, Node.js version, browser, etc.
6. **Screenshots** - If applicable

### Suggesting Features

We welcome feature suggestions! Please open an issue with:

1. **Use case** - Explain the problem this feature would solve
2. **Proposed solution** - Describe your suggested approach
3. **Alternatives** - Any alternative solutions you've considered
4. **Additional context** - Screenshots, mockups, or examples

### Pull Requests

We actively welcome pull requests! Here's how to contribute code:

#### 1. Fork and Clone

```bash
# Fork the repository on GitHub, then:
git clone https://github.com/YOUR_USERNAME/hr-candidate-sourcing.git
cd hr-candidate-sourcing
```

#### 2. Set Up Development Environment

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
# Fill in your actual values in .env

# Start development server
npm run dev
```

#### 3. Create a Branch

```bash
# Create a feature branch from main
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

#### 4. Make Your Changes

- Write clean, readable code
- Follow existing code style and conventions
- Use TypeScript for type safety
- Keep commits focused and atomic
- Write meaningful commit messages

**Code Style Guidelines:**
- Use TypeScript for all new files
- Follow existing patterns for component structure
- Use Tailwind CSS for styling (avoid custom CSS)
- Prefer functional components with hooks
- Add comments for complex logic

#### 5. Test Your Changes

Before submitting:

```bash
# Build the project to check for errors
npm run build

# Run the development server and test manually
npm run dev
```

Ensure:
- No TypeScript errors
- No console errors in browser
- Responsive design works on mobile/tablet/desktop
- Existing features still work

#### 6. Commit Your Changes

```bash
git add .
git commit -m "feat: add new feature description"
# Or
git commit -m "fix: resolve issue with XYZ"
```

**Commit Message Format:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

#### 7. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then open a pull request on GitHub with:

- **Clear title** - Describe what the PR does
- **Description** - Explain the changes and why they're needed
- **Screenshots** - If UI changes are involved
- **Related issues** - Link any related issues (e.g., "Fixes #123")

### Pull Request Review Process

1. A maintainer will review your PR
2. They may request changes or ask questions
3. Address any feedback by pushing new commits
4. Once approved, a maintainer will merge your PR

## Development Guidelines

### Project Structure

```
src/
├── app/              # Next.js app routes and pages
├── components/       # Reusable React components
├── lib/              # Utility functions and services
├── hooks/            # Custom React hooks
└── models/           # Mongoose database models
```

### Key Technologies

- **Next.js 14+** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **MongoDB** with Mongoose
- **Lyzr AI** for AI agents

### Best Practices

1. **Keep it simple** - This is a simplified open-source version
2. **Mobile first** - Ensure responsive design
3. **Type safety** - Leverage TypeScript
4. **User experience** - Consider the end user
5. **Performance** - Optimize where possible

### What We're Looking For

**Good candidates for contributions:**
- Bug fixes
- UI/UX improvements
- Documentation improvements
- Performance optimizations
- Accessibility enhancements
- Code quality improvements

**Not suitable for this project:**
- Enterprise-specific features (contact Lyzr for custom solutions)
- Breaking changes to core functionality
- Features that significantly increase complexity

## Getting Help

- **Questions about contributing?** Open a discussion or issue
- **Stuck on something?** Ask in your pull request
- **Need enterprise features?** [Contact Lyzr](https://www.lyzr.ai/)

## Code of Conduct

### Our Standards

- Be respectful and inclusive
- Welcome newcomers and help them learn
- Focus on constructive feedback
- Assume good intentions
- Keep discussions professional

### Unacceptable Behavior

- Harassment, discrimination, or offensive comments
- Trolling or insulting remarks
- Personal attacks
- Publishing others' private information
- Any conduct inappropriate in a professional setting

## Recognition

Contributors will be recognized in:
- GitHub contributors list
- Release notes for significant contributions
- Community acknowledgments

Thank you for contributing to make HR candidate sourcing more accessible and efficient!

---

**Questions?** Feel free to open an issue or reach out to the maintainers.
