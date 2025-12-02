# Contributing to SlabStak

Thank you for your interest in contributing to SlabStak! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and professional
- Focus on constructive feedback
- Help make SlabStak better for everyone

## Getting Started

1. **Fork the repository**
2. **Clone your fork**:
   ```bash
   git clone https://github.com/YOUR_USERNAME/slabstak.git
   cd slabstak
   ```
3. **Follow the setup guide**: See `docs/SETUP_GUIDE.md`
4. **Create a branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

### Quick Start

Use the development startup script:
```bash
./start-dev.sh
```

This starts both frontend (port 3000) and backend (port 8000).

### Manual Start

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Code Style

### TypeScript/React (Frontend)

- Use TypeScript for all new files
- Follow existing code patterns
- Use functional components with hooks
- Keep components focused and small
- Add types for all props and state

**Example:**
```typescript
interface CardProps {
  card: CardRecord;
  onDelete?: (id: string) => void;
}

export function CardComponent({ card, onDelete }: CardProps) {
  // Component logic
}
```

### Python (Backend)

- Follow PEP 8 style guide
- Use type hints
- Add docstrings for functions
- Keep functions focused

**Example:**
```python
async def get_user_cards(user_id: str) -> list[CardRecord]:
    """
    Fetch all cards for a specific user.

    Args:
        user_id: The user's unique identifier

    Returns:
        List of card records
    """
    # Function logic
```

## Making Changes

### 1. Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

Examples:
- `feature/ebay-api-integration`
- `fix/card-upload-validation`
- `docs/update-setup-guide`

### 2. Commit Messages

Follow conventional commits:

```
type(scope): short description

Longer description if needed

- Bullet points for details
- More details
```

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting
- `refactor:` - Code refactoring
- `test:` - Tests
- `chore:` - Maintenance

**Examples:**
```
feat(scan): add batch upload support

fix(vault): resolve card deletion bug

docs(readme): update deployment instructions
```

### 3. Pull Requests

1. **Update your branch**:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Push your changes**:
   ```bash
   git push origin feature/your-feature-name
   ```

3. **Create Pull Request** on GitHub with:
   - Clear title describing the change
   - Description of what changed and why
   - Screenshots for UI changes
   - Link to related issues

4. **PR Template**:
   ```markdown
   ## Description
   Brief description of changes

   ## Type of Change
   - [ ] Bug fix
   - [ ] New feature
   - [ ] Breaking change
   - [ ] Documentation update

   ## Testing
   - [ ] Tested locally
   - [ ] Added tests (if applicable)

   ## Screenshots (if applicable)
   [Add screenshots]

   ## Checklist
   - [ ] Code follows style guidelines
   - [ ] Self-review completed
   - [ ] Comments added for complex code
   - [ ] Documentation updated
   - [ ] No new warnings
   ```

## Testing

### Frontend Testing

Currently, tests are not yet implemented. When adding tests:

```bash
cd frontend
npm test
```

### Backend Testing

Currently, tests are not yet implemented. When adding tests:

```bash
cd backend
pytest
```

### Manual Testing Checklist

Before submitting PR, test:

- [ ] User signup/login
- [ ] Card upload and scan
- [ ] Save card to vault
- [ ] View vault
- [ ] Subscription upgrade
- [ ] All new features work
- [ ] No console errors
- [ ] Mobile responsive (if UI changes)

## Areas for Contribution

### High Priority

1. **Real Market Data Integration**
   - eBay API implementation
   - TCGPlayer integration
   - Price aggregation logic

2. **Testing**
   - Frontend unit tests
   - Backend unit tests
   - Integration tests
   - E2E tests

3. **Admin Dashboard**
   - User management UI
   - System metrics
   - Content moderation

### Medium Priority

4. **Performance**
   - Caching layer
   - Query optimization
   - Image optimization

5. **Features**
   - Bulk CSV import
   - Advanced search
   - Portfolio analytics
   - Email notifications

6. **Documentation**
   - API documentation
   - User guides
   - Video tutorials

### Low Priority

7. **Mobile App**
   - React Native implementation
   - Native camera integration

8. **Advanced Features**
   - Social features
   - Marketplace integration
   - AI chat assistant

## Project Structure

```
slabstak/
├── frontend/          # Next.js app
│   ├── src/app/      # Pages & API routes
│   ├── src/components/  # React components
│   └── src/lib/      # Utilities
├── backend/          # FastAPI app
│   └── main.py       # Main application
├── database/         # Migrations
└── docs/            # Documentation
```

## Environment Variables

Never commit:
- `.env`
- `.env.local`
- API keys
- Secrets

Always use:
- `.env.example` files
- Environment variable references

## Database Migrations

When making database changes:

1. Create new migration file: `database/migrations/00X_description.sql`
2. Test locally
3. Document in PR
4. Add rollback instructions

## Questions?

- Open an issue for bugs
- Start a discussion for features
- Ask in pull request comments

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Credited in documentation

## License

By contributing, you agree that your contributions will be licensed under the same license as the project (Proprietary).

---

Thank you for contributing to SlabStak! 🙏
