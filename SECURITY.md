# Security Policy

## Supported Versions

This project is currently in active development. Security updates will be applied to the latest version.

| Version | Supported          |
| ------- | ------------------ |
| latest  | :white_check_mark: |

## Security Best Practices for Users

If you're deploying MoneyMap, please follow these security practices:

### Environment Variables
- Never commit `.env.local` or any file containing real credentials
- Use strong, unique values for all API keys and secrets
- Rotate Supabase service role keys regularly
- Keep environment variables secure in your deployment platform

### Supabase Security
- Enable Row Level Security (RLS) on all tables
- Regularly review and update RLS policies
- Use the anon key for client-side code only
- Never expose the service role key in client-side code
- Monitor Supabase auth logs for suspicious activity

### Dependency Management
- Run `npm audit` regularly to check for vulnerabilities
- Keep dependencies up to date with `npm update`
- Review security advisories for critical dependencies

### API Keys & Integrations
- For Monobank integration, store API tokens securely in the database
- Implement rate limiting for API endpoints
- Validate and sanitize all user inputs
- Use HTTPS for all production deployments

### Authentication
- Rely on Supabase Auth for user authentication
- Implement proper session management
- Use secure cookie settings in production
- Enable OAuth only from trusted providers

## Known Security Considerations

### Data Privacy
- MoneyMap handles sensitive financial data
- All user data is isolated using Supabase Row Level Security
- Monobank API tokens are stored encrypted in the database

### Third-Party Services
- **Supabase**: Backend and authentication provider
- **Vercel**: Deployment platform (if used)
- **Monobank API**: Bank integration for Ukrainian users

## Security Updates

Security updates will be announced through:
- GitHub releases
- Commit messages tagged with `[SECURITY]`
- Repository security advisories (if applicable)

## Questions

If you have questions about security but don't have a specific vulnerability to report, feel free to open a regular GitHub issue or contact the maintainer.
