import { CheckCircle2, Circle } from 'lucide-react';
import { getPasswordStrength } from '../utils/passwordPolicy';
import './PasswordStrengthMeter.css';

type PasswordStrengthMeterProps = {
    password: string;
};

const PasswordStrengthMeter = ({ password }: PasswordStrengthMeterProps) => {
    const strength = getPasswordStrength(password);

    return (
        <div className={`password-strength password-strength--${strength.score}`}>
            <div className="password-strength__head">
                <span>Password strength</span>
                <strong>{strength.label}</strong>
            </div>
            <div className="password-strength__bar" aria-hidden="true">
                <span />
                <span />
                <span />
                <span />
            </div>
            <ul>
                {strength.rules.map((rule) => (
                    <li key={rule.id} className={rule.valid ? 'valid' : ''}>
                        {rule.valid ? <CheckCircle2 size={13} /> : <Circle size={13} />}
                        {rule.label}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default PasswordStrengthMeter;
